import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';
import { check, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../src/types/express';
import { JWTPayload } from '../src/types/api';
import { IUserDocument } from '../src/types/models';
import auth from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// @route   GET api/auth
// @desc    獲取已登入用戶
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const user = await User.findOne({ _id: authReq.user.id.toString() }).select('-password');
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        message: '找不到用戶',
        timestamp: new Date()
      });
      return;
    }

    res.json({
      success: true,
      message: '用戶資訊獲取成功',
      data: user,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('獲取用戶資訊錯誤:', err);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    });
  }
});

// @route   POST api/auth
// @desc    用戶登入 & 獲取 token 和用戶資訊
// @access  Public
router.post(
  '/',
  [
    check('password', '密碼為必填欄位').exists(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '驗證失敗',
        details: errors.array(),
        timestamp: new Date()
      });
      return;
    }

    const { username, email, password } = req.body;

    if (!username && !email) {
      res.status(400).json({
        success: false,
        message: '請提供用戶名或電子郵件',
        timestamp: new Date()
      });
      return;
    }

    try {
      let user: IUserDocument | null = null;
      
      if (username) {
        user = await User.findByUsername(username.toString());
      } else if (email) {
        user = await User.findOne({ email: email.toString(), isActive: true });
      }

      if (!user) {
        res.status(400).json({
          success: false,
          message: '無效的憑證',
          timestamp: new Date()
        });
        return;
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: '無效的憑證',
          timestamp: new Date()
        });
        return;
      }

      // 更新最後登入時間
      user.lastLogin = new Date();
      await user.save();

      // 準備 JWT Payload
      const payload: JWTPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        isAdmin: user.role === 'admin'
      };

      const jwtSecret = config.get<string>('jwtSecret');
      const jwtExpiration = config.get<string>('jwtExpiration') || '24h';

      const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration } as jwt.SignOptions);
      
      res.json({
        success: true,
        message: '登入成功',
        data: {
          token: token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            isAdmin: user.role === 'admin'
          },
          expiresIn: jwtExpiration
        },
        timestamp: new Date()
      });
    } catch (err) {
      console.error('登入錯誤:', err);
      res.status(500).json({
        success: false,
        message: '伺服器錯誤',
        error: err instanceof Error ? err.message : '未知錯誤',
        timestamp: new Date()
      });
    }
  }
);

// @route   PUT api/auth/update
// @desc    更新當前用戶資訊
// @access  Private
router.put(
  '/update',
  auth,
  [
    check('username', '用戶名不能為空').optional().not().isEmpty(),
    check('email', '請提供有效的電子郵件').optional().isEmail(),
    check('newPassword', '新密碼長度至少需要4個字符').optional().isLength({ min: 4 })
  ],
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '驗證失敗',
        details: errors.array(),
        timestamp: new Date()
      });
      return;
    }

    const { username, email, currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(authReq.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '找不到用戶',
          timestamp: new Date()
        });
        return;
      }

      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({
            success: false,
            message: '請提供當前密碼',
            timestamp: new Date()
          });
          return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          res.status(400).json({
            success: false,
            message: '當前密碼不正確',
            timestamp: new Date()
          });
          return;
        }

        user.password = newPassword;
      }

      if (username && username !== user.username) {
        const existingUser = await User.findOne({ 
          username: username.toString().trim(),
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: '此用戶名已被使用',
            timestamp: new Date()
          });
          return;
        }
        
        user.username = username.toString().trim();
      }

      await user.save();

      const updatedUser = await User.findById(user.id).select('-password');
      
      res.json({
        success: true,
        message: '用戶資訊更新成功',
        data: updatedUser,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('用戶更新錯誤:', err);
      res.status(500).json({
        success: false,
        message: '伺服器錯誤',
        error: err instanceof Error ? err.message : '未知錯誤',
        timestamp: new Date()
      });
    }
  }
);

export default router;