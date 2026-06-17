import React from 'react';
import { Typography, Tag, Button, Empty, Card, Divider } from 'antd';
import { CompassOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from '../context/LanguageContext';
import syllabusData from '../data/syllabusData.json';

const { Paragraph, Text, Title } = Typography;

export default function SyllabusTab({ courseCode }) {
  const { language, t } = useTranslation();
  const isTh = language === 'th';

  const syllabus = syllabusData[courseCode];

  // If no syllabus data at all or it's a placeholder / null
  if (!syllabus || (!syllabus.description_en && !syllabus.description_th) || syllabus.description_en.includes("No syllabus data")) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#64748b', fontSize: '13px' }}>
              {isTh 
                ? 'ยังไม่มีข้อมูลประมวลรายวิชา (Syllabus) ในระบบของแผนภูมิ' 
                : 'No static syllabus data available in this chart yet.'}
            </span>
          }
        >
          <div style={{ marginTop: '16px', maxWidth: '420px', margin: '16px auto 0 auto' }}>
            <Card size="small" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <Paragraph style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', textAlign: 'left', lineHeight: 1.5 }}>
                {isTh 
                  ? `คุณสามารถค้นหารายละเอียดคำอธิบายรายวิชา วัตถุประสงค์ (CLOs) และการประเมินผลแบบล่าสุดได้โดยตรงที่ระบบสำนักทะเบียน CMU MIS โดยใช้รหัสวิชา: ` 
                  : `You can search for the official up-to-date course description, learning outcomes (CLOs), and grading breakdown directly on the CMU MIS Portal using Course No: `}
                <Text code style={{ fontSize: '12px', fontWeight: 800 }}>{courseCode}</Text>
              </Paragraph>
              <Button 
                type="primary" 
                icon={<CompassOutlined />}
                href="https://www.mis.cmu.ac.th/TQF/coursepublic.aspx"
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  borderRadius: '6px', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  backgroundColor: '#4f46e5',
                  borderColor: '#4f46e5'
                }}
              >
                {isTh ? 'ไปที่ระบบ CMU MIS TQF' : 'Go to CMU MIS TQF'}
              </Button>
            </Card>
          </div>
        </Empty>
      </div>
    );
  }

  // Active language text selection
  const description = isTh 
    ? (syllabus.description_th || syllabus.description_en) 
    : (syllabus.description_en || syllabus.description_th);

  const hasClos = syllabus.clos && syllabus.clos.length > 0;
  const hasAssessment = syllabus.assessment && syllabus.assessment.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px 0 24px 0' }}>
      
      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#4f46e5', fontSize: '16px' }} />
          <Text strong style={{ fontSize: '13px', color: '#334155' }}>
            {isTh ? 'เวอร์ชันประมวลรายวิชาที่เผยแพร่' : 'Published Syllabus Version'}
          </Text>
        </div>
        <Tag color="geekblue" style={{ margin: 0, fontWeight: 700 }}>
          {isTh 
            ? `ปีการศึกษา ${syllabus.year} ภาคเรียนที่ ${syllabus.semester}`
            : `Academic Year ${syllabus.year} - Term ${syllabus.semester}`}
        </Tag>
      </div>

      {/* Description */}
      <div>
        <Title level={5} style={{ fontWeight: 800, margin: '0 0 8px 0', color: '#1e293b', fontSize: '14px' }}>
          {isTh ? '📖 คำอธิบายลักษณะกระบวนวิชา (Course Description)' : '📖 Course Description'}
        </Title>
        <Paragraph style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', margin: 0 }}>
          {description}
        </Paragraph>
      </div>

      {/* Course Learning Outcomes (CLOs) if available */}
      {hasClos && (
        <div>
          <Title level={5} style={{ fontWeight: 800, margin: '0 0 8px 0', color: '#1e293b', fontSize: '14px' }}>
            {isTh ? '📋 ผลการเรียนรู้ที่คาดหวัง (Course Learning Outcomes - CLOs)' : '📋 Course Learning Outcomes (CLOs)'}
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {syllabus.clos.map((clo, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  background: '#f8fafc', 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  borderLeft: '3px solid #4f46e5',
                  fontSize: '12.5px',
                  color: '#475569'
                }}
              >
                <span style={{ fontWeight: 700, color: '#4f46e5' }}>CLO {idx + 1}</span>
                <span>{clo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment/Grading breakdown if available */}
      {hasAssessment && (
        <div>
          <Title level={5} style={{ fontWeight: 800, margin: '0 0 8px 0', color: '#1e293b', fontSize: '14px' }}>
            {isTh ? '📊 สัดส่วนการประเมินผลเรียน' : '📊 Assessment & Grading Criteria'}
          </Title>
          <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>
                    {isTh ? 'วิธีการประเมิน' : 'Evaluation Method'}
                  </th>
                  <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: '100px', textAlign: 'right' }}>
                    {isTh ? 'สัดส่วน (%)' : 'Weight (%)'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {syllabus.assessment.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === syllabus.assessment.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>{item.method}</td>
                    <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 700, textAlign: 'right' }}>{item.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Link to MIS */}
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          type="link" 
          icon={<CompassOutlined />}
          href="https://www.mis.cmu.ac.th/TQF/coursepublic.aspx"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}
        >
          {isTh 
            ? 'ข้อมูลทางการบนหน้าเว็บบริการหลักสูตร CMU MIS TQF ↗' 
            : 'View official registry page on CMU MIS TQF ↗'}
        </Button>
      </div>

    </div>
  );
}
