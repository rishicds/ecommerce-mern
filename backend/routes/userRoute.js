import express from 'express';
import { userLogin, registerUser, getUserData, userLogout, updateProfile, addToWaitlist, getNotifications, markNotificationRead, checkWaitlist, deleteNotification, deleteReadNotifications, clearAllNotifications } from '../controllers/userController.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', userLogin);
userRouter.get('/dashboard', verifyUser, getUserData);
userRouter.put('/profile', verifyUser, updateProfile);
userRouter.post('/logout', verifyUser, userLogout);

// Waitlist & notifications
userRouter.post('/waitlist/:productId', verifyUser, addToWaitlist);
userRouter.get('/waitlist/:productId', verifyUser, checkWaitlist);
userRouter.get('/notifications', verifyUser, getNotifications);
userRouter.post('/notifications/:id/read', verifyUser, markNotificationRead);
userRouter.delete('/notifications/:id', verifyUser, deleteNotification);
userRouter.delete('/notifications/read', verifyUser, deleteReadNotifications);
userRouter.delete('/notifications', verifyUser, clearAllNotifications);

export default userRouter;