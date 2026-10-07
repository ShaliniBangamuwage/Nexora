import express from "express";
import { db } from "../firebaseAdmin.js";

const router = express.Router();

/* ================================
   GENERATE CUSTOM USER ID (USR001)
================================ */
const generateUserId = async () => {
  try {
    const usersSnap = await db.collection("users")
      .orderBy("userId", "desc")
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return "USR001";
    }

    const lastUser = usersSnap.docs[0].data();

    if (!lastUser.userId) {
      return "USR001";
    }

    const lastNumber = parseInt(lastUser.userId.replace("USR", ""), 10);

    const newNumber = lastNumber + 1;

    return `USR${String(newNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating userId:", error);
    return "USR001";
  }
};

/* ================================
   GET /api/users - Fetch all users
================================ */
router.get("/", async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();

    const users = usersSnap.docs.map(doc => ({
      id: doc.id,        // Firestore document ID
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* ================================
   POST /api/users - CREATE USER
   (WITH AUTO USER ID)
================================ */
router.post("/", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role
    } = req.body;

    // Generate custom ID
    const userId = await generateUserId();

    const newUserRef = await db.collection("users").add({
      userId, 
      name: fullName,
      email,
      phone,
      password,
      role: role || "customer",
      status: "active",
      loyaltyPoints: 0,
      registeredAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        docId: newUserRef.id,
        userId
      }
    });

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* ================================
   PUT /loyalty - Add loyalty points
================================ */
router.put("/:userId/loyalty", async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    if (!points || isNaN(points)) {
      return res.status(400).json({
        success: false,
        error: "Invalid points value"
      });
    }

    const snapshot = await db.collection("users")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const userDoc = snapshot.docs[0];
    const userRef = userDoc.ref;

    const currentPoints = userDoc.data().loyaltyPoints || 0;
    const newPoints = currentPoints + Number(points);

    await userRef.update({
      loyaltyPoints: newPoints
    });

    res.json({
      success: true,
      data: {
        userId,
        loyaltyPoints: newPoints
      }
    });

  } catch (error) {
    console.error("Error updating loyalty points:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* ================================
   PUT /status - Update user status
================================ */
router.put("/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required"
      });
    }

    const snapshot = await db.collection("users")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const userRef = snapshot.docs[0].ref;

    await userRef.update({
      status
    });

    res.json({
      success: true,
      data: {
        userId,
        status
      }
    });

  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;