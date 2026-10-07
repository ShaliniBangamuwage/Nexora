import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service.js';
import { MailService } from '../../shared/mail/mail.service.js';
import { FieldValue } from 'firebase-admin/firestore';

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%';
  const all = upper + lower + digits + special;

  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 10; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

interface AccountRequest {
  status: string;
  email: string;
  companyName?: string;
  fullName?: string;
  type: 'supplier' | 'pharmacist';
  phone?: string;
  contactPerson?: string;
  businessRegNo?: string;
  businessAddress?: string;
  categories?: string[];
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  nicNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  specialization?: string;
}
@Injectable()
export class AccountRequestsService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
  ) {}

  async getRequests() {
    const db = this.firebaseService.getDb();
    const snap = await db
      .collection('pendingRequests')
      .orderBy('requestedAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async approveRequest(requestId: string) {
    const db = this.firebaseService.getDb();
    const auth = this.firebaseService.getAdmin();

    const reqRef = db.collection('pendingRequests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) throw new NotFoundException('Request not found');

    const request = reqSnap.data() as AccountRequest;
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been processed');
    }

    const tempPassword = generateTempPassword();
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: request.email,
        password: tempPassword,
        displayName: request.companyName || request.fullName,
      });
    } catch (authError: any) {
      if (
        (authError as { code: string }).code === 'auth/email-already-exists'
      ) {
        throw new BadRequestException(
          `An account with email ${request.email} already exists.`,
        );
      }
      throw authError;
    }
    const uid = (userRecord as { uid: string }).uid;

    if (request.type === 'supplier') {
      const supplierId = await this.generateNextId('suppliers', 'S');
      await db
        .collection('suppliers')
        .doc(uid)
        .set({
          supplierId,
          userId: uid,
          name: request.companyName,
          email: request.email,
          phone: request.phone,
          contactPerson: request.contactPerson,
          businessRegNo: request.businessRegNo,
          businessAddress: request.businessAddress,
          categories: request.categories || [],
          bankName: request.bankName,
          accountNumber: request.accountNumber,
          accountHolderName: request.accountHolderName,
          rating: 0,
          status: 'active',
          role: 'supplier',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    } else {
      const pharmacistId = await this.generateNextId('pharmacists', 'P');
      await db.collection('pharmacists').doc(uid).set({
        pharmacistId,
        userId: uid,
        name: request.fullName,
        email: request.email,
        phone: request.phone,
        nicNumber: request.nicNumber,
        licenseNumber: request.licenseNumber,
        licenseExpiry: request.licenseExpiry,
        specialization: request.specialization,
        role: 'pharmacist',
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await reqRef.update({
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
    });

    try {
      await this.mailService.sendApprovalEmail({
        to: request.email,
        name: request.companyName ?? request.fullName ?? '',
        role: request.type,
        tempPassword,
      });
    } catch (mailError) {
      console.error('[AccountRequests] Approval email failed (account still created):', mailError);
    }

    return {
      success: true,
      message: `Account approved. Email sent to ${request.email}.`,
      tempPassword,
    };
  }

  async rejectRequest(requestId: string) {
    const db = this.firebaseService.getDb();
    const reqRef = db.collection('pendingRequests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) throw new NotFoundException('Request not found');

    const request = reqSnap.data() as AccountRequest;
    if (request.status !== 'pending') {
      throw new BadRequestException('Request has already been processed');
    }

    // 1. Mark as rejected in Firestore
    await reqRef.update({
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
    });

    // 2. Send rejection email
    try {
      await this.mailService.sendRejectionEmail({
        to: request.email,
        name: request.companyName ?? request.fullName ?? '',
        role: request.type,
      });
    } catch (mailError) {
      console.error('[AccountRequests] Rejection email failed (status still updated):', mailError);
    }

    return {
      success: true,
      message: `Request rejected. Email sent to ${request.email}.`,
    };
  }

  private async generateNextId(
    collectionName: string,
    prefix: string,
  ): Promise<string> {
    const db = this.firebaseService.getDb();
    const snapshot = await db.collection(collectionName).get();
    const idField = `${collectionName.slice(0, -1)}Id`; // "suppliers" → "supplierId"
    let maxNum = 0;

    snapshot.forEach((d) => {
      const val = d.data()[idField] as string | undefined;
      if (val) {
        const num = parseInt(String(val).replace(prefix, ''), 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }
}
