import { Modal, Button, Tag, Divider, Alert, Space, Typography, Row, Col, Select } from 'antd';
import { 
  CheckCircleOutlined, 
  LockOutlined, 
  UnlockOutlined, 
  ArrowRightOutlined, 
  CloseOutlined, 
  CheckOutlined,
  ToolOutlined,
  CompassOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useTranslation } from '../context/LanguageContext';
import { getPrepData } from '../data/coursePrepData';
import { freeElectivesPool } from '../data/courses';

const { Title, Paragraph, Text } = Typography;

export default function CourseDetailModal({ 
  course, 
  onClose, 
  isCompleted, 
  isUnlocked, 
  onToggleComplete,
  allCourses,
  completedCourses = [],
  onSelectCourse,
  selectedGeElectives = {},
  onSelectGeElective,
  selectedMajorElectives = {},
  onSelectMajorElective,
  selectedFreeElectives = {},
  onSelectFreeElective,
  onAddMajorElectiveSlotClick
}) {
  const { language, t } = useTranslation();
  const isTh = language === 'th';

  if (!course) return null;

  const isGeElectiveSlot = course.category === 'GE_Elective' && course.code.startsWith('GE-EL-');
  const selectedGeSubCode = isGeElectiveSlot ? selectedGeElectives[course.code] : null;

  const isMajorElectiveSlot = course.category === 'Major_Elective' && course.code.startsWith('MJ-EL-');
  const selectedMajorSubCode = isMajorElectiveSlot ? selectedMajorElectives[course.code] : null;

  const isFreeElectiveSlot = course.category === 'Free_Elective' && course.code.startsWith('FE-EL-');
  const selectedFreeSubCode = isFreeElectiveSlot ? selectedFreeElectives[course.code] : null;

  const selectedSubCode = selectedGeSubCode || selectedMajorSubCode || selectedFreeSubCode;
  const displayCourse = selectedSubCode 
    ? (allCourses.find(c => c.code === selectedSubCode) || freeElectivesPool.find(c => c.code === selectedSubCode)) 
    : course;

  // Find post-requisites: courses that have this course code in their prereqs
  const postReqs = allCourses.filter(c => c.prereqs.includes(course.code));

  // Find prerequisite course objects
  const prereqObjects = allCourses.filter(c => course.prereqs.includes(c.code));

  // Get learning prep data from our new helper
  const prepData = getPrepData(displayCourse.code);

  const getCategoryLabel = (cat) => {
    switch(cat) {
      case 'GE_Required': return isTh ? 'ศึกษาทั่วไป (บังคับ)' : 'GE Required';
      case 'GE_Elective': return isTh ? 'ศึกษาทั่วไป (เลือก)' : 'GE Elective';
      case 'Core': return isTh ? 'วิชาแกน' : 'Core Courses';
      case 'Major_Required': return isTh ? 'วิชาเอกบังคับ' : 'Major Required';
      case 'Major_Elective': return isTh ? 'วิชาเอกเลือก' : 'Major Elective';
      case 'Free_Elective': return isTh ? 'วิชาเลือกเสรี' : 'Free Elective';
      default: return cat.replace('_', ' ');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'GE_Required': return 'purple';
      case 'GE_Elective': return 'purple';
      case 'Core': return 'geekblue';
      case 'Major_Required': return 'blue';
      case 'Major_Elective': return 'emerald';
      case 'Free_Elective': return 'warning';
      default: return 'default';
    }
  };

  // Parse credits details (e.g., 3(1-4-4))
  const creditDetails = () => {
    const match = displayCourse.credits.match(/(\d)\((\d)-(\d)-(\d)\)/);
    if (match) {
      return {
        total: match[1],
        lecture: match[2],
        lab: match[3],
        selfStudy: match[4]
      };
    }
    return null;
  };

  const cd = creditDetails();

  return (
    <Modal
      title={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
              {displayCourse.code}
            </span>
            <Tag color={getCategoryColor(course.category)} style={{ margin: 0, fontWeight: 700 }}>
              {getCategoryLabel(course.category)}
            </Tag>
          </div>
          <Title level={4} style={{ margin: '4px 0 0 0', fontWeight: 800, color: '#1e293b' }}>
            {displayCourse.dept_code} — {isTh ? displayCourse.title_th : displayCourse.title_en}
          </Title>
        </div>
      }
      open={true}
      onCancel={onClose}
      width={680}
      footer={[
        <Button key="close" onClick={onClose} style={{ borderRadius: '8px' }}>
          {t('modal_close')}
        </Button>,
        (!course.code.includes('-EL-') || isGeElectiveSlot || isMajorElectiveSlot || isFreeElectiveSlot) && (
          <Button
            key="complete"
            type={isCompleted ? 'default' : 'primary'}
            danger={isCompleted}
            icon={isCompleted ? <CloseOutlined /> : <CheckOutlined />}
            onClick={() => onToggleComplete(course.code)}
            disabled={(!isUnlocked && !isCompleted) || ((isGeElectiveSlot || isMajorElectiveSlot || isFreeElectiveSlot) && !selectedSubCode)}
            style={{ 
              borderRadius: '8px', 
              fontWeight: 700,
              backgroundColor: !isCompleted && isUnlocked && (!isGeElectiveSlot && !isMajorElectiveSlot && !isFreeElectiveSlot || selectedSubCode) ? '#4f46e5' : undefined,
              borderColor: !isCompleted && isUnlocked && (!isGeElectiveSlot && !isMajorElectiveSlot && !isFreeElectiveSlot || selectedSubCode) ? '#4f46e5' : undefined,
            }}
          >
            {isCompleted ? t('modal_mark_incomplete') : t('modal_mark_complete')}
          </Button>
        )
      ]}
      style={{ borderRadius: '16px', overflow: 'hidden' }}
    >
      <div style={{ marginTop: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
        {/* Free Elective Dropdown Selector in Modal */}
        {isFreeElectiveSlot && (
          <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              {isTh ? 'เลือกวิชาเลือกเสรี' : 'Select Free Elective Course'}
            </span>
            <Select
              showSearch
              placeholder={isTh ? 'ค้นหาและเลือกวิชาเลือกเสรี...' : 'Search and select free elective...'}
              optionFilterProp="children"
              filterOption={(input, option) => {
                const text = String(option.children || '').toLowerCase();
                return text.includes(input.toLowerCase());
              }}
              value={selectedSubCode || undefined}
              onChange={(val) => onSelectFreeElective(course.code, val || null)}
              style={{ width: '100%', marginBottom: '12px' }}
              allowClear
              dropdownMatchSelectWidth={false}
              dropdownRender={menu => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ padding: '0 8px 4px 8px', display: 'flex', justifyContent: 'center' }}>
                    <a 
                      href="https://cmu-review.vercel.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CompassOutlined /> {isTh ? 'ดูรีวิววิชาที่ cmu-review.vercel.app' : 'See course reviews at cmu-review.vercel.app'}
                    </a>
                  </div>
                </>
              )}
            >
              {(() => {
                const combinedPool = [
                  ...freeElectivesPool,
                  ...allCourses.filter(c => !c.code.includes('-EL-'))
                ];
                const uniquePool = Array.from(new Map(combinedPool.map(c => [c.code, c])).values());
                const selectedElsewhere = Object.entries(selectedFreeElectives)
                  .filter(([slot]) => slot !== course.code)
                  .map(([, subCode]) => subCode);
                
                return uniquePool.map(opt => (
                  <Select.Option 
                    key={opt.code} 
                    value={opt.code}
                    disabled={selectedElsewhere.includes(opt.code)}
                  >
                    {opt.code} - {isTh ? opt.title_th : opt.title_en} ({opt.dept_code})
                  </Select.Option>
                ));
              })()}
            </Select>
            
            {/* Banner recommendation link */}
            <div style={{ background: '#fffbeb', border: '1px dashed #fbbf24', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '20px' }}>💡</div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: '12.5px', color: '#b45309', fontWeight: 600, display: 'block' }}>
                  {isTh ? 'ไม่แน่ใจว่าจะลงวิชาไหนดีใช่ไหม?' : 'Not sure which course to pick?'}
                </Text>
                <a 
                  href="https://cmu-review.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                >
                  {isTh ? 'ไปค้นหารีวิววิชาและอ่านประสบการณ์จากรุ่นพี่ได้ที่ cmu-review.vercel.app ↗' : 'Find course reviews and senior feedback on cmu-review.vercel.app ↗'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* GE Elective Dropdown Selector in Modal */}
        {isGeElectiveSlot && (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              {t('modal_select_ge')}
            </span>
            <Select
              placeholder={t('modal_select_placeholder')}
              value={selectedSubCode || undefined}
              onChange={(val) => onSelectGeElective(course.code, val || null)}
              style={{ width: '100%' }}
              allowClear
              dropdownMatchSelectWidth={false}
            >
              {(() => {
                const pool = allCourses.filter(c => c.category === 'GE_Elective' && !c.code.startsWith('GE-EL-'));
                const innovativeCodes = ['013110', '206100', '356102', '852100', '888107'];
                const filteredPool = course.code === 'GE-EL-01'
                  ? pool.filter(c => innovativeCodes.includes(c.code))
                  : pool.filter(c => !innovativeCodes.includes(c.code));
                const selectedElsewhere = Object.entries(selectedGeElectives)
                  .filter(([slot]) => slot !== course.code)
                  .map(([, subCode]) => subCode);
                
                return filteredPool.map(opt => (
                  <Select.Option 
                    key={opt.code} 
                    value={opt.code}
                    disabled={selectedElsewhere.includes(opt.code)}
                  >
                    {opt.code} - {isTh ? opt.title_th : opt.title_en} ({opt.dept_code})
                  </Select.Option>
                ));
              })()}
            </Select>
          </div>
        )}

        {/* Major Elective Slot Assignment in Modal */}
        {isMajorElectiveSlot && (
          <div style={{ background: '#f0fdfa', padding: '16px', borderRadius: '12px', border: '1px solid #ccfbf1', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              {t('major_elec_status')}
            </span>
            {selectedMajorSubCode ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                  <Text strong style={{ color: '#0f766e', fontSize: '13px' }}>
                    {t('assigned')} {displayCourse.code} - {isTh ? displayCourse.title_th : displayCourse.title_en}
                  </Text>
                  <Text style={{ display: 'block', fontSize: '11px', color: '#0d9488', marginTop: '2px' }}>
                    {t('card_credits')} {displayCourse.credits} ({displayCourse.dept_code})
                  </Text>
                </div>
                <Space>
                  <Button 
                    type="primary" 
                    ghost
                    size="small"
                    onClick={() => {
                      onClose();
                      onAddMajorElectiveSlotClick && onAddMajorElectiveSlotClick(course.code);
                    }}
                    style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 700, borderColor: '#0d9488', color: '#0d9488' }}
                  >
                    {t('change_course')}
                  </Button>
                  <Button 
                    danger
                    ghost
                    size="small"
                    onClick={() => {
                      onSelectMajorElective && onSelectMajorElective(course.code, null);
                    }}
                    style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}
                  >
                    {t('remove_assignment')}
                  </Button>
                </Space>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <Text style={{ fontSize: '12px', color: '#0d9488', fontWeight: 600 }}>
                  {t('no_major_assigned')}
                </Text>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    onClose();
                    onAddMajorElectiveSlotClick && onAddMajorElectiveSlotClick(course.code);
                  }}
                  style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#0d9488', borderColor: '#0d9488' }}
                >
                  {t('browse_assign_course')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Banner Alert for eligibility */}
        <div style={{ marginBottom: '20px' }}>
          {isCompleted ? (
            <Alert
              message={t('course_completed')}
              description={t('course_completed_desc')}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ borderRadius: '8px' }}
            />
          ) : isUnlocked ? (
            <Alert
              message={t('eligible_to_enroll')}
              description={t('eligible_to_enroll_desc')}
              type="info"
              showIcon
              icon={<UnlockOutlined />}
              style={{ borderRadius: '8px' }}
            />
          ) : (
            <Alert
              message={t('prereqs_locked')}
              description={`${t('prereqs_locked_desc')} ${
                course.prereq_text_th.includes('หรือ') || course.prereq_text_en.toLowerCase().includes('or') 
                  ? t('at_least_one_of') 
                  : t('all_of')
              } [${course.prereqs.join(', ')}]`}
              type="error"
              showIcon
              icon={<LockOutlined />}
              style={{ borderRadius: '8px' }}
            />
          )}
        </div>

        {/* Course Description */}
        <div style={{ marginBottom: '20px' }}>
          <Title level={5} style={{ fontWeight: 800 }}>{t('course_overview')}</Title>
          <Paragraph style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{displayCourse.title_th}</span>
            {displayCourse.description || t('no_description')}
          </Paragraph>
        </div>

        {/* Course Credits Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{isTh ? 'หน่วยกิตทั้งหมด' : 'Total Credits'}</span>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>{cd ? cd.total : course.credit_count}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{t('lecture_hours')}</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#475569' }}>{cd ? cd.lecture : '-'}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{t('lab_practice')}</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#475569' }}>{cd ? cd.lab : '-'}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{t('self_study')}</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#475569' }}>{cd ? cd.selfStudy : '-'}</div>
            </div>
          </Col>
        </Row>

        {/* Enrichment Section: Learning Prep & Software */}
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ background: 'linear-gradient(to right, #f5f3ff, #f8fafc)', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <Title level={5} style={{ fontWeight: 800, color: '#5b21b6', margin: '0 0 12px 0' }} className="flex items-center gap-1.5">
            <ThunderboltOutlined /> {t('learning_prep_tips')}
          </Title>
          
          <Paragraph style={{ fontSize: '12.5px', color: '#4c1d95', fontWeight: 500, lineHeight: 1.5, marginBottom: '16px' }}>
            {prepData.prep}
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                <ToolOutlined /> {t('recommended_software')}
              </span>
              {prepData.software.length > 0 ? (
                <Space wrap size={[4, 8]}>
                  {prepData.software.map(soft => (
                    <Tag key={soft} color="purple" style={{ fontWeight: 700 }}>{soft}</Tag>
                  ))}
                </Space>
              ) : (
                <Text style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>{t('no_software_needed')}</Text>
              )}
            </Col>

            <Col xs={24} md={12}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                <CompassOutlined /> {t('key_skills_concepts')}
              </span>
              {prepData.skills.length > 0 ? (
                <Space wrap size={[4, 8]}>
                  {prepData.skills.map(skill => (
                    <Tag key={skill} color="processing" style={{ fontWeight: 700 }}>{skill}</Tag>
                  ))}
                </Space>
              ) : (
                <Text style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>{t('foundational_skills')}</Text>
              )}
            </Col>
          </Row>

          {prepData.keywords.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t('keywords')}</span>
              <Space wrap size={[4, 4]}>
                {prepData.keywords.map(kw => (
                  <Tag key={kw} style={{ fontSize: '10px', color: '#4b5563', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px' }}>#{kw}</Tag>
                ))}
              </Space>
            </div>
          )}
        </div>

        {/* Prerequisites Checklist */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ fontWeight: 800 }}>{isTh ? 'วิชาบังคับก่อนที่ต้องเรียน (Prerequisites)' : 'Prerequisites Checklist'}</Title>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>{isTh ? 'แผนผังบังคับก่อนที่เป็นทางการ:' : 'Official Mappings:'}</span>
            <Text style={{ fontSize: '12px', color: '#334155' }}>
              {isTh ? (
                <>
                  {displayCourse.prereq_text_th}
                  {displayCourse.prereq_text_en !== displayCourse.prereq_text_th && (
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginTop: '2px' }}>({displayCourse.prereq_text_en})</span>
                  )}
                </>
              ) : (
                <>
                  {displayCourse.prereq_text_en}
                  {displayCourse.prereq_text_th !== displayCourse.prereq_text_en && (
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginTop: '2px' }}>({displayCourse.prereq_text_th})</span>
                  )}
                </>
              )}
            </Text>
          </div>

          {prereqObjects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prereqObjects.map(pr => {
                const isCompletedPrereq = completedCourses.includes(pr.code);
                return (
                  <div 
                    key={pr.code} 
                    onClick={() => onSelectCourse(pr.code)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '10px 14px', 
                      background: '#ffffff',
                      border: `1px solid ${isCompletedPrereq ? '#bbf7d0' : '#fecdd3'}`, 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                    }}
                    className="hover:border-slate-400 transition-colors"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isCompletedPrereq ? (
                        <CheckCircleOutlined style={{ color: '#10b981', fontSize: '16px' }} />
                      ) : (
                        <LockOutlined style={{ color: '#ef4444', fontSize: '16px' }} />
                      )}
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '3px', marginRight: '6px' }}>
                          {pr.code}
                        </span>
                        <Text strong style={{ fontSize: '12.5px', color: '#1e293b' }}>
                          {pr.dept_code} — {isTh ? pr.title_th : pr.title_en}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: isCompletedPrereq ? '#10b981' : '#ef4444' }}>
                      <span>{isCompletedPrereq ? (isTh ? 'เรียนผ่านแล้ว' : 'Completed') : (isTh ? 'รอดำเนินการ' : 'Pending')}</span>
                      <ArrowRightOutlined style={{ color: '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '12px' }}>
              {isTh ? 'รายวิชานี้ไม่มีวิชาบังคับก่อน คุณสามารถลงทะเบียนเรียนได้ทันที' : 'This course has no prerequisites. You can enroll in it at any time.'}
            </Text>
          )}
        </div>

        {/* Successor Unlocks */}
        <div>
          <Title level={5} style={{ fontWeight: 800 }}>{isTh ? 'วิชาในอนาคตที่สามารถปลดล็อกได้' : 'Future Courses Unlocked'}</Title>
          {postReqs.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {postReqs.map(po => (
                <Button 
                  key={po.code} 
                  size="small" 
                  icon={<ArrowRightOutlined />} 
                  onClick={() => onSelectCourse(po.code)}
                  style={{ borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {po.dept_code} ({po.code})
                </Button>
              ))}
            </div>
          ) : (
            <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '12px' }}>
              {isTh ? 'รายวิชานี้เป็นวิชาสิ้นสุดของหลักสูตร ไม่ปลดล็อกวิชาอื่นเพิ่มเติม (เช่น สหกิจศึกษา หรือ วิชาเฉพาะทางอิสระ)' : 'Does not unlock any specific courses. This is a terminal/capstone course or independent specialization.'}
            </Text>
          )}
        </div>
      </div>
    </Modal>
  );
}
