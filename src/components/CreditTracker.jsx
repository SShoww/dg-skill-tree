import { Card, Progress, Row, Col, Typography, Tag } from 'antd';
import { 
  BookOutlined, 
  CompassOutlined, 
  AppstoreOutlined, 
  TrophyOutlined, 
  InteractionOutlined,
  ReadOutlined 
} from '@ant-design/icons';
import { useTranslation } from '../context/LanguageContext';

const { Title, Text } = Typography;

export default function CreditTracker({ completedCredits }) {
  const { language, t } = useTranslation();
  const isTh = language === 'th';

  const graduationRequirements = {
    GE: 30,
    Core: 24,
    Major_Required: 57,
    Major_Elective: 15,
    Free_Elective: 6
  };

  const getCategoryTheme = (key) => {
    switch (key) {
      case 'GE': return { color: '#8b5cf6', strokeColor: '#a78bfa', bgColor: 'rgba(139, 92, 246, 0.04)', icon: <BookOutlined style={{ color: '#8b5cf6' }} /> };
      case 'Core': return { color: '#6366f1', strokeColor: '#818cf8', bgColor: 'rgba(99, 102, 241, 0.04)', icon: <CompassOutlined style={{ color: '#6366f1' }} /> };
      case 'Major_Required': return { color: '#3b82f6', strokeColor: '#60a5fa', bgColor: 'rgba(59, 130, 246, 0.04)', icon: <AppstoreOutlined style={{ color: '#3b82f6' }} /> };
      case 'Major_Elective': return { color: '#10b981', strokeColor: '#34d399', bgColor: 'rgba(16, 185, 129, 0.04)', icon: <TrophyOutlined style={{ color: '#10b981' }} /> };
      case 'Free_Elective': return { color: '#f59e0b', strokeColor: '#fbbf24', bgColor: 'rgba(245, 158, 11, 0.04)', icon: <InteractionOutlined style={{ color: '#f59e0b' }} /> };
      default: return { color: '#6366f1', strokeColor: '#818cf8', bgColor: 'rgba(99, 102, 241, 0.04)', icon: <CompassOutlined style={{ color: '#6366f1' }} /> };
    }
  };

  const getLabel = (key) => {
    switch (key) {
      case 'GE': return { en: 'General Education', th: 'ศึกษาทั่วไป' };
      case 'Core': return { en: 'Core Courses', th: 'วิชาแกน' };
      case 'Major_Required': return { en: 'Major Required', th: 'วิชาเอกบังคับ' };
      case 'Major_Elective': return { en: 'Major Elective', th: 'วิชาเอกเลือก' };
      case 'Free_Elective': return { en: 'Free Elective', th: 'วิชาเลือกเสรี' };
      default: return { en: 'Total Credits', th: 'หน่วยกิตทั้งหมด' };
    }
  };

  const totalCompleted = Object.values(completedCredits).reduce((a, b) => a + b, 0);
  const totalRequired = 132;
  const overallPercent = Math.min(100, Math.round((totalCompleted / totalRequired) * 100));

  return (
    <Card 
      className="shadow-sm border-slate-100"
      style={{ 
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }} className="flex items-center gap-2">
            <ReadOutlined style={{ color: '#4f46e5', fontSize: '24px' }} />
            {isTh ? 'เครื่องมือตรวจสอบหน่วยกิต CMU CAMT' : 'CMU CAMT Graduation Credit Tracker'}
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {isTh ? 'แผนผังแสดงหน่วยกิตสะสมรายวิชาสำหรับสาขาวิชาดิจิทัลเกมส์ (ทั้งหมด 132 หน่วยกิต)' : 'Visualizing curriculum requirements for Digital Games program (132 Credits total)'}
          </Text>
        </div>
        
        <div style={{ background: '#ffffff', padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} className="w-full sm:w-auto justify-between sm:justify-start">
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>{isTh ? 'ความคืบหน้ารวม' : 'Total Progress'}</span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{totalCompleted}</span>
            <span style={{ color: '#94a3b8', margin: '0 4px', fontSize: '14px' }}>/</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{totalRequired} {isTh ? 'หน่วยกิต' : 'Credits'}</span>
          </div>
          <Progress 
            type="circle" 
            percent={overallPercent} 
            size={46} 
            strokeWidth={10}
            strokeColor={{
              '0%': '#10b981',
              '100%': '#4f46e5',
            }}
          />
        </div>
      </div>

      {/* Grid of Categories */}
      <Row gutter={[16, 16]}>
        {Object.keys(graduationRequirements).map((key) => {
          const completed = completedCredits[key] || 0;
          const required = graduationRequirements[key];
          const isCompleted = completed >= required;
          const theme = getCategoryTheme(key);
          const labels = getLabel(key);
          const percent = Math.min(100, Math.round((completed / required) * 100));

          return (
            <Col 
              xs={24} 
              sm={12} 
              md={8} 
              lg={{ flex: '1 0 18%', maxWidth: '20%' }} 
              xl={{ flex: '1 0 18%', maxWidth: '20%' }} 
              key={key} 
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div 
                style={{ 
                  background: theme.bgColor, 
                  border: `1px solid ${isCompleted ? '#d1fae5' : '#f1f5f9'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  boxShadow: isCompleted ? '0 4px 6px -1px rgba(16, 185, 129, 0.03)' : 'none'
                }}
                className="hover:scale-[1.02] transition-transform duration-200"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ background: '#ffffff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                      {theme.icon}
                    </div>
                    {isCompleted ? (
                      <Tag color="success" style={{ border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '10px' }}>{isTh ? 'ครบแล้ว' : 'Met'}</Tag>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{percent}%</span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {key.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${labels.en} (${labels.th})`}>
                    {isTh ? labels.th : labels.en}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    {isTh ? labels.en : labels.th}
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: completed > 0 ? theme.color : '#94a3b8' }}>{completed}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>/ {required} {isTh ? 'นก.' : 'Cr'}</span>
                  </div>
                  <Progress 
                    percent={percent} 
                    showInfo={false} 
                    strokeColor={theme.strokeColor} 
                    trailColor="#e2e8f0"
                    strokeWidth={6}
                    style={{ margin: 0 }}
                  />
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* overall bar */}
      <div style={{ marginTop: '24px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{isTh ? 'ความสำเร็จหลักสูตรทั้งหมด' : 'Overall Curriculum Completion'}</span>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#4f46e5' }}>{overallPercent}% {isTh ? 'สำเร็จแล้ว' : 'Completed'}</span>
        </div>
        <Progress 
          percent={overallPercent} 
          strokeColor={{
            '0%': '#3b82f6',
            '50%': '#10b981',
            '100%': '#4f46e5',
          }} 
          showInfo={false}
          strokeWidth={10}
        />
      </div>
    </Card>
  );
}
