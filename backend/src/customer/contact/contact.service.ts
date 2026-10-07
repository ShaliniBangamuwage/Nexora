import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

@Injectable()
export class ContactService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async sendMessage(body: any) {
    const db = this.firebaseService.getDb();
    const docRef = await db.collection('contactMessages').add({
      name: body.name || null,
      email: body.email || null,
      message: body.message || null,
      reply: '',
      status: 'unread',
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  }

  async getMessagesByEmail(email: string) {
    const db = this.firebaseService.getDb();
    const snapshot = await db
      .collection('contactMessages')
      .where('email', '==', email)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getAllMessages() {
    const db = this.firebaseService.getDb();
    const snapshot = await db
      .collection('contactMessages')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async markAsRead(id: string) {
    const db = this.firebaseService.getDb();
    await db.collection('contactMessages').doc(id).update({ status: 'read' });
    return { success: true, id };
  }

  async replyMessage(id: string, reply: string) {
    const db = this.firebaseService.getDb();
    await db.collection('contactMessages').doc(id).update({
      reply,
      status: 'replied',
    });
    return { success: true, id };
  }
}
