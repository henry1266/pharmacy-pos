import User, { IUser, UserRole } from '../User';

describe('User Model', () => {
  beforeEach(async () => {
    // 清理測試數據
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('應該成功創建有效的用戶', async () => {
      const userData: Partial<IUser> = {
        name: '測試用戶',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        role: 'staff',
        settings: {
          theme: {
            currentThemeId: 'default',
            themes: []
          },
          notifications: {
            enabled: true,
            sound: true,
            desktop: false
          }
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isActive).toBe(true); // 默認值
      expect(savedUser.settings).toEqual(userData.settings);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('應該要求必填欄位', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('應該要求用戶名稱', async () => {
      const userData = {
        username: 'testuser',
        password: 'hashedpassword123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(/name.*required/i);
    });

    it('應該要求用戶名', async () => {
      const userData = {
        name: '測試用戶',
        password: 'hashedpassword123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(/username.*required/i);
    });

    it('應該要求密碼', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(/password.*required/i);
    });

    it('應該確保用戶名唯一性', async () => {
      const userData1 = {
        name: '用戶1',
        username: 'testuser',
        password: 'password123'
      };

      const userData2 = {
        name: '用戶2',
        username: 'testuser', // 相同用戶名
        password: 'password456'
      };

      await new User(userData1).save();
      
      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow(/duplicate key/i);
    });

    it('應該驗證角色枚舉值', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123',
        role: 'invalid_role' as UserRole
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('應該設置默認角色為staff', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.role).toBe('staff');
    });

    it('應該設置默認isActive為true', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.isActive).toBe(true);
    });

    it('應該設置默認settings為空物件', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.settings).toEqual({});
    });
  });

  describe('Email Validation', () => {
    it('應該允許空的電子郵件', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.email).toBeUndefined();
    });

    it('應該確保電子郵件唯一性', async () => {
      const userData1 = {
        name: '用戶1',
        username: 'user1',
        email: 'test@example.com',
        password: 'password123'
      };

      const userData2 = {
        name: '用戶2',
        username: 'user2',
        email: 'test@example.com', // 相同電子郵件
        password: 'password456'
      };

      await new User(userData1).save();
      
      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow(/此電子郵件已被使用/);
    });

    it('應該允許多個用戶沒有電子郵件', async () => {
      const userData1 = {
        name: '用戶1',
        username: 'user1',
        password: 'password123'
      };

      const userData2 = {
        name: '用戶2',
        username: 'user2',
        password: 'password456'
      };

      await new User(userData1).save();
      const user2 = await new User(userData2).save();
      
      expect(user2._id).toBeDefined();
    });
  });

  describe('Settings Field', () => {
    it('應該儲存複雜的設定物件', async () => {
      const complexSettings = {
        shortcuts: [
          {
            id: 'shortcut1',
            name: '常用藥品',
            productIds: ['prod1', 'prod2', 'prod3']
          }
        ],
        theme: {
          currentThemeId: 'dark',
          themes: [
            {
              id: 'dark',
              name: '深色主題',
              colors: {
                primary: '#000000',
                secondary: '#333333'
              }
            }
          ]
        },
        notifications: {
          enabled: true,
          sound: false,
          desktop: true
        },
        customField: 'custom value'
      };

      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123',
        settings: complexSettings
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.settings).toEqual(complexSettings);
    });

    it('應該允許更新設定', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123',
        settings: { theme: { currentThemeId: 'light' } }
      };

      const user = await new User(userData).save();
      
      user.settings = {
        ...user.settings,
        notifications: { enabled: false, sound: true, desktop: false }
      };
      
      const updatedUser = await user.save();
      
      expect(updatedUser.settings.notifications).toEqual({
        enabled: false,
        sound: true,
        desktop: false
      });
    });
  });

  describe('Timestamps', () => {
    it('應該自動設置createdAt和updatedAt', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('應該在更新時更新updatedAt', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = await new User(userData).save();
      const originalUpdatedAt = user.updatedAt;
      
      // 等待一毫秒確保時間差異
      await new Promise(resolve => setTimeout(resolve, 1));
      
      user.name = '更新的用戶名';
      const updatedUser = await user.save();
      
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('LastLogin Field', () => {
    it('應該允許設置lastLogin', async () => {
      const loginTime = new Date();
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123',
        lastLogin: loginTime
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.lastLogin).toEqual(loginTime);
    });

    it('應該允許更新lastLogin', async () => {
      const userData = {
        name: '測試用戶',
        username: 'testuser',
        password: 'password123'
      };

      const user = await new User(userData).save();
      expect(user.lastLogin).toBeUndefined();
      
      const loginTime = new Date();
      user.lastLogin = loginTime;
      const updatedUser = await user.save();
      
      expect(updatedUser.lastLogin).toEqual(loginTime);
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // 創建測試數據
      await User.create([
        {
          name: '管理員',
          username: 'admin',
          password: 'password123',
          role: 'admin',
          isActive: true
        },
        {
          name: '藥師',
          username: 'pharmacist',
          password: 'password123',
          role: 'pharmacist',
          isActive: true
        },
        {
          name: '員工',
          username: 'staff',
          password: 'password123',
          role: 'staff',
          isActive: false
        }
      ]);
    });

    it('應該能夠查詢活躍用戶', async () => {
      const activeUsers = await User.find({ isActive: true });
      expect(activeUsers).toHaveLength(2);
    });

    it('應該能夠按角色查詢', async () => {
      const admins = await User.find({ role: 'admin' });
      expect(admins).toHaveLength(1);
      expect(admins[0].username).toBe('admin');
    });

    it('應該能夠按用戶名查詢', async () => {
      const user = await User.findOne({ username: 'pharmacist' });
      expect(user).toBeTruthy();
      expect(user?.name).toBe('藥師');
    });
  });
});