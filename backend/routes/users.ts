import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';
import { check, validationResult } from 'express-validator';
import { ApiResponse, ErrorResponse, JWTPayload } from '../src/types/api';
import { IUserDocument } from '../src/types/models';
import User from '../models/User';

const router = express.Router();

// 型別定義
interface UserRegistrationRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// @route   POST api/users
// @desc    註冊用戶
// @access  Public
router.post(
  '/',
  [
    check('name', '姓名為必填欄位').not().isEmpty(),
    check('email', '請輸入有效的電子郵件').isEmail(),
    check('password', '請輸入至少6個字符的密碼').isLength({ min: 6 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '驗證失敗',
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    const { name, email, password, role } = req.body as UserRegistrationRequest;

    try {
      // 檢查用戶是否已存在
      // 修正：將 email 參數轉換為字串
      let user = await User.findOne({ email: email.toString() });

      if (user) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '用戶已存在',
          timestamp: new Date()
        };
        return res.status(400).json(errorResponse);
      }

      // 創建新用戶 (使用 name 作為 username)
      user = new User({
        username: name, // 將 name 映射到 username
        email,
        password,
        role: role || 'user'
      });

      // 加密密碼 (User 模型中的 pre-save 中間件會處理)
      await user.save();

      // 準備 JWT Payload
      const payload: JWTPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        isAdmin: user.role === 'admin'
      };

      // 獲取 JWT 配置
      const jwtSecret = config.get<string>('jwtSecret');
      const jwtExpiration = config.get<string>('jwtExpiration') || '24h';

      // 生成 JWT
      jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: jwtExpiration } as jwt.SignOptions,
        (err, token) => {
          if (err) throw err;
          
          if (!token) {
            throw new Error('Token 生成失敗');
          }
          
          const response: ApiResponse<{ token: string }> = {
            success: true,
            message: '用戶註冊成功',
            data: { token },
            timestamp: new Date()
          };
          
          res.json(response);
        }
      );
    } catch (err) {
      console.error('用戶註冊錯誤:', err instanceof Error ? err.message : err);
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: '伺服器錯誤',
        timestamp: new Date()
      };
      
      res.status(500).json(errorResponse);
    }
  }
);

export default router;