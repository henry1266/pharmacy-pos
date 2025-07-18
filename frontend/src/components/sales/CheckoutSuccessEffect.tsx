import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';

interface CheckoutSuccessEffectProps {
  show: boolean;
  onComplete: () => void;
  totalAmount?: number;
  saleNumber?: string;
}

const CheckoutSuccessEffect: React.FC<CheckoutSuccessEffectProps> = ({
  show,
  onComplete,
  totalAmount,
  saleNumber
}) => {
  const theme = useTheme();
  const [stage, setStage] = useState<'hidden' | 'appearing' | 'celebrating' | 'fading'>('hidden');

  useEffect(() => {
    if (show) {
      setStage('appearing');
      
      // 階段性動畫時序
      const timer1 = setTimeout(() => setStage('celebrating'), 400);
      const timer2 = setTimeout(() => setStage('fading'), 800);
      const timer3 = setTimeout(() => {
        setStage('hidden');
        onComplete();
      }, 1200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [show, onComplete]);

  if (!show && stage === 'hidden') return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: stage === 'fading' 
          ? 'rgba(0, 0, 0, 0)' 
          : 'rgba(0, 0, 0, 0.8)',
        transition: 'background 0.5s ease-out',
        pointerEvents: stage === 'fading' ? 'none' : 'all'
      }}
    >
      {/* 背景粒子效果 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        {stage === 'celebrating' && Array.from({ length: 20 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle-float-${i} 2s ease-out forwards`,
              '@keyframes particle-float-0': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-20px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-100px)', opacity: 0 }
              },
              '@keyframes particle-float-1': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-30px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-120px)', opacity: 0 }
              },
              '@keyframes particle-float-2': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-25px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-110px)', opacity: 0 }
              },
              '@keyframes particle-float-3': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-35px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-130px)', opacity: 0 }
              },
              '@keyframes particle-float-4': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-15px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-90px)', opacity: 0 }
              },
              '@keyframes particle-float-5': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-40px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-140px)', opacity: 0 }
              },
              '@keyframes particle-float-6': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-22px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-105px)', opacity: 0 }
              },
              '@keyframes particle-float-7': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-28px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-115px)', opacity: 0 }
              },
              '@keyframes particle-float-8': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-18px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-95px)', opacity: 0 }
              },
              '@keyframes particle-float-9': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-32px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-125px)', opacity: 0 }
              },
              '@keyframes particle-float-10': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-26px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-108px)', opacity: 0 }
              },
              '@keyframes particle-float-11': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-38px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-135px)', opacity: 0 }
              },
              '@keyframes particle-float-12': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-24px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-112px)', opacity: 0 }
              },
              '@keyframes particle-float-13': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-16px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-88px)', opacity: 0 }
              },
              '@keyframes particle-float-14': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-34px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-128px)', opacity: 0 }
              },
              '@keyframes particle-float-15': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-21px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-102px)', opacity: 0 }
              },
              '@keyframes particle-float-16': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-29px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-118px)', opacity: 0 }
              },
              '@keyframes particle-float-17': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-37px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-132px)', opacity: 0 }
              },
              '@keyframes particle-float-18': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-19px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-98px)', opacity: 0 }
              },
              '@keyframes particle-float-19': {
                '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
                '20%': { transform: 'scale(1) translateY(-31px)', opacity: 1 },
                '100%': { transform: 'scale(0) translateY(-122px)', opacity: 0 }
              }
            }}
          />
        ))}
      </Box>

      {/* 主要內容 */}
      <Fade in={stage !== 'hidden'} timeout={300}>
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            transform: stage === 'fading' ? 'scale(0.8)' : 'scale(1)',
            transition: 'transform 0.5s ease-out'
          }}
        >
          {/* 成功圖示 */}
          <Zoom in={stage === 'appearing' || stage === 'celebrating'} timeout={500}>
            <Box sx={{ mb: 3 }}>
              <CheckCircleIcon
                sx={{
                  fontSize: '120px',
                  color: theme.palette.success.main,
                  filter: 'drop-shadow(0 4px 20px rgba(76, 175, 80, 0.4))',
                  animation: stage === 'celebrating' ? 'pulse 1s ease-in-out infinite alternate' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1.1)' }
                  }
                }}
              />
            </Box>
          </Zoom>

          {/* 成功文字 */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(255, 255, 255, 0.3)',
              animation: stage === 'celebrating' ? 'glow 2s ease-in-out infinite alternate' : 'none',
              '@keyframes glow': {
                '0%': { filter: 'brightness(1)' },
                '100%': { filter: 'brightness(1.2)' }
              }
            }}
          >
            結帳成功！
          </Typography>

          {/* 金額顯示 */}
          {totalAmount && (
            <Typography
              variant="h4"
              sx={{
                mb: 1,
                color: theme.palette.warning.main,
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(255, 193, 7, 0.4)'
              }}
            >
              NT$ {totalAmount.toFixed(0)}
            </Typography>
          )}

          {/* 單號顯示 */}
          {saleNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <ReceiptIcon sx={{ mr: 1, color: theme.palette.info.main }} />
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.info.main,
                  fontFamily: 'monospace'
                }}
              >
                {saleNumber}
              </Typography>
            </Box>
          )}

          {/* 慶祝圖示 */}
          {stage === 'celebrating' && (
            <Box sx={{ mt: 2 }}>
              <CelebrationIcon
                sx={{
                  fontSize: '60px',
                  color: theme.palette.secondary.main,
                  animation: 'celebrate 1s ease-in-out infinite',
                  '@keyframes celebrate': {
                    '0%, 100%': { transform: 'rotate(-10deg)' },
                    '50%': { transform: 'rotate(10deg)' }
                  }
                }}
              />
            </Box>
          )}

          {/* 感謝文字 */}
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              opacity: 0.9,
              fontStyle: 'italic'
            }}
          >
            
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default CheckoutSuccessEffect;