import { Card, Checkbox, Badge, Tooltip } from 'antd';
import { 
  LockOutlined, 
  UnlockOutlined, 
  CheckCircleFilled, 
  SearchOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { coursesData, freeElectivesPool } from '../data/courses';

export default function CourseCard({ 
  course, 
  isCompleted, 
  isUnlocked, 
  isSelected, 
  isCareerRecommended,
  hasActiveCareerFocus,
  missingPrereqs = [],
  isOrPrereq = false,
  onClick, 
  onDoubleClick,
  onOpenDetails,
  onToggleComplete,
  selectedGeElectives = {},
  selectedMajorElectives = {},
  selectedFreeElectives = {},
  // Hover pathway highlights
  onHoverStart,
  onHoverEnd,
  highlightType, // 'selected' | 'prereq' | 'unlock' | null
  isDimmed,
  isTimeline = false,
  isMobileGrid = false  // 2-column mobile grid mode: auto-height, 2-line title
}) {
  const { language, t } = useTranslation();
  const { isDarkMode } = useTheme();
  const isTh = language === 'th';

  const isGeElectiveSlot = course.category === 'GE_Elective' && course.code.startsWith('GE-EL-');
  const selectedGeSubCode = isGeElectiveSlot ? selectedGeElectives[course.code] : null;

  const isMajorElectiveSlot = course.category === 'Major_Elective' && course.code.startsWith('MJ-EL-');
  const selectedMajorSubCode = isMajorElectiveSlot ? selectedMajorElectives[course.code] : null;

  const isFreeElectiveSlot = course.category === 'Free_Elective' && course.code.startsWith('FE-EL-');
  const selectedFreeSubCode = isFreeElectiveSlot ? selectedFreeElectives[course.code] : null;

  const selectedSubCode = selectedGeSubCode || selectedMajorSubCode || selectedFreeSubCode;
  const displayCourse = selectedSubCode 
    ? (coursesData.find(c => c.code === selectedSubCode) || freeElectivesPool.find(c => c.code === selectedSubCode)) 
    : course;
  const displayTitle = isTh ? displayCourse.title_th : displayCourse.title_en;

  const isElectiveSlot = course.code.includes('-EL-') || (course.year === null && course.semester === null);
  const isAssignedMajorElective = isMajorElectiveSlot && selectedMajorSubCode;

  // Category Color and Theme configurations
  const getCategoryStyles = (category) => {
    if (isAssignedMajorElective) {
      return { borderLColor: '#0d9488', bgColor: isDarkMode ? '#052e2b' : '#f0fdfa', tagColor: 'teal' };
    }
    if (isGeElectiveSlot && selectedGeSubCode) {
      return { borderLColor: '#a855f7', bgColor: isDarkMode ? '#220b45' : '#faf5ff', tagColor: 'purple' };
    }
    if (isFreeElectiveSlot && selectedFreeSubCode) {
      return { borderLColor: '#f59e0b', bgColor: isDarkMode ? '#381602' : '#fffbeb', tagColor: 'warning' };
    }
    switch (category) {
      case 'GE_Required': 
        return { borderLColor: '#8b5cf6', bgColor: isDarkMode ? '#220b45' : '#faf5ff', tagColor: 'purple' };
      case 'GE_Elective': 
        return { borderLColor: '#a78bfa', bgColor: isDarkMode ? '#171138' : '#faf9ff', tagColor: 'purple' };
      case 'Core': 
        return { borderLColor: '#5b44e4', bgColor: isDarkMode ? '#1a163a' : '#f5f3ff', tagColor: 'geekblue' };
      case 'Major_Required': 
        return { borderLColor: '#3b82f6', bgColor: isDarkMode ? '#0d182e' : '#eff6ff', tagColor: 'blue' };
      case 'Major_Elective': 
        return { borderLColor: '#10b981', bgColor: isDarkMode ? '#05291b' : '#ecfdf5', tagColor: 'emerald' };
      case 'Free_Elective': 
        return { borderLColor: '#f59e0b', bgColor: isDarkMode ? '#381602' : '#fffbeb', tagColor: 'warning' };
      default: 
        return { borderLColor: '#64748b', bgColor: isDarkMode ? '#1c1c1e' : '#f8fafc', tagColor: 'default' };
    }
  };

  const catStyle = getCategoryStyles(course.category);

  // Border styling based on state and highlighting
  const getBorderStyles = () => {
    if (isSelected || highlightType === 'selected') {
      return { border: '2px solid #5b44e4', boxShadow: '0 0 10px rgba(91, 68, 228, 0.25)', scale: 'scale(1.02)' };
    }
    if (highlightType === 'prereq') {
      return { border: '2px solid #ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.25)', scale: 'scale(1.02)' };
    }
    if (highlightType === 'unlock') {
      return { border: '2px solid #10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)', scale: 'scale(1.02)' };
    }
    if (hasActiveCareerFocus && isCareerRecommended) {
      return { border: '2px solid #f59e0b', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.12)', scale: 'scale(1)' };
    }
    if (isCompleted) {
      return { border: isDarkMode ? '1px solid #064e3b' : '1px solid #a7f3d0', boxShadow: 'none', scale: 'scale(1)' };
    }
    if (!isUnlocked) {
      return { border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0', boxShadow: 'none', scale: 'scale(1)' };
    }
    return { border: isDarkMode ? '1px solid #3f3f46' : '1px solid #cbd5e1', boxShadow: 'none', scale: 'scale(1)' };
  };

  const borderStyle = getBorderStyles();

  // Dimming factor when other items are active
  const opacityClass = isDimmed ? 'opacity-15 grayscale-[30%] blur-[0.3px]' : 'opacity-100';

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onToggleComplete(course.code);
  };

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

  // Enriched Tooltip description
  const tooltipContent = (
    <div style={{ padding: '4px', maxWidth: '240px' }}>
      <div style={{ fontWeight: 800, fontSize: '12px', color: '#ffffff' }}>
        {displayCourse.dept_code}
      </div>
      <div style={{ fontWeight: 700, fontSize: '11px', color: '#e2e8f0', marginTop: '2px' }}>
        {displayCourse.title_en}
      </div>
      <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
        {displayCourse.title_th}
      </div>
      <Divider style={{ margin: '6px 0', borderColor: '#475569' }} />
      <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
        {t('card_category')} <strong>{getCategoryLabel(course.category)}</strong>
      </div>
      <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
        {t('card_credits')} <strong>{displayCourse.credits}</strong>
      </div>
      
      {isGeElectiveSlot && !selectedSubCode && (
        <div style={{ color: '#fbbf24', marginTop: '6px', fontWeight: 700, fontSize: '10px' }}>
          {t('tooltip_choose_ge')}
        </div>
      )}

      {missingPrereqs.length > 0 && !isCompleted && (
        <div style={{ color: '#fca5a5', marginTop: '6px', fontWeight: 700, fontSize: '10px' }}>
          {t('tooltip_locked')} {isOrPrereq ? missingPrereqs.join(` ${t('card_or')} `) : missingPrereqs.join(' & ')}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip 
      title={tooltipContent} 
      mouseEnterDelay={0.4} 
      overlayStyle={{ zIndex: 1000, pointerEvents: 'none' }}
    >
      <div 
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => onHoverStart && onHoverStart(course.code)}
        onMouseLeave={() => onHoverEnd && onHoverEnd()}
        className={`course-card course-card-wrapper transition-all duration-200 cursor-pointer ${opacityClass}`}
        style={{
          transform: borderStyle.scale,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          width: isTimeline ? '200px' : '100%',
          display: 'flex',
          justifyContent: 'stretch'
        }}
      >
        <Card
          size="small"
          className={`course-card-card${isMobileGrid ? ' mobile-grid-card' : ''}`}
          style={{
            borderRadius: isMobileGrid ? '10px' : '8px',
            borderLeftWidth: '4px',
            borderLeftColor: catStyle.borderLColor,
            borderStyle: 'solid',
            borderTopColor: borderStyle.border.split(' ')[2],
            borderRightColor: borderStyle.border.split(' ')[2],
            borderBottomColor: borderStyle.border.split(' ')[2],
            borderWidth: borderStyle.border.split(' ')[0],
            backgroundColor: catStyle.bgColor,
            boxShadow: isMobileGrid
              ? (borderStyle.boxShadow !== 'none' ? borderStyle.boxShadow : '0 1px 4px rgba(0,0,0,0.06)')
              : borderStyle.boxShadow,
            height: isMobileGrid ? 'auto' : (isTimeline ? '120px' : '82px'),
            minHeight: isMobileGrid ? '90px' : (isTimeline ? '120px' : '82px'),
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden'
          }}
          bodyStyle={{ 
            padding: isMobileGrid ? '6px 8px' : (isTimeline ? '8px 12px' : '6px 10px'), 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            height: '100%',
            width: '100%'
          }}
        >
          {/* Card Top: Code, Credits, and Status Checkbox */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '18px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="course-card-code" style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#94a3b8' }}>
                {displayCourse.code}
              </span>
              {/* Info Icon Button */}
              {(!isGeElectiveSlot || selectedSubCode) && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenDetails) onOpenDetails();
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="info-icon text-slate-400 hover:text-indigo-600 transition-colors"
                  style={{ cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center' }}
                  title={t('info_icon_tooltip') || "Click/tap to view details"}
                >
                  <InfoCircleOutlined />
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              {hasActiveCareerFocus && isCareerRecommended && (
                <Badge status="processing" color="gold" style={{ marginRight: '2px' }} />
              )}
              
              <span className="course-card-credits" style={{ fontSize: '9px', fontWeight: 700, color: isDarkMode ? '#d4d4d8' : '#64748b', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', padding: '1px 4px', borderRadius: '4px' }}>
                {displayCourse.credits.split('(')[0]} {t('card_cr')}
              </span>

              {(!isElectiveSlot || ((isGeElectiveSlot || isMajorElectiveSlot || isFreeElectiveSlot) && selectedSubCode)) && (
                <Checkbox
                  checked={isCompleted}
                  disabled={!isUnlocked && !isCompleted}
                  onChange={handleCheckboxChange}
                  style={{ transform: 'scale(0.85)', marginLeft: '2px' }}
                />
              )}
            </div>
          </div>

          {/* Card Middle: Title */}
          <div style={{ margin: '2px 0', height: isTimeline ? '52px' : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
            <div 
              className="course-card-title-code"
              style={{ fontSize: isMobileGrid ? '10px' : '11px', fontWeight: 800, color: isDarkMode ? '#f4f4f5' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
            >
              {displayCourse.dept_code}
            </div>
            
            {isGeElectiveSlot && !selectedSubCode ? (
              <div className="course-card-title-text" style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <SearchOutlined /> {t('card_choose_elective')}
              </div>
            ) : (
              <div 
                className="course-card-title-text"
                style={{ 
                  fontSize: isMobileGrid ? '9px' : '10px', 
                  fontWeight: 600, 
                  color: isDarkMode ? '#e4e4e7' : '#475569', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  display: (isTimeline || isMobileGrid) ? '-webkit-box' : 'block',
                  WebkitLineClamp: isTimeline ? 3 : (isMobileGrid ? 2 : undefined),
                  WebkitBoxOrient: (isTimeline || isMobileGrid) ? 'vertical' : undefined,
                  whiteSpace: (isTimeline || isMobileGrid) ? 'normal' : 'nowrap',
                  lineHeight: '1.3'
                }} 
                title={displayTitle}
              >
                {displayTitle}
              </div>
            )}
          </div>

          {/* Card Bottom: Status Lock Icon & Category */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '8px', 
              color: isDarkMode ? '#a1a1aa' : '#94a3b8',
              fontWeight: 600,
              height: '14px',
              borderTop: isDarkMode ? '1px dashed rgba(255,255,255,0.08)' : '1px dashed rgba(0,0,0,0.05)',
              paddingTop: '2px',
              width: '100%'
            }}
          >
            <span className="course-card-footer" style={{ textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.2px' }}>
              {(() => {
                if (isTh) {
                  switch(course.category) {
                    case 'GE_Required': return 'GE บังคับ';
                    case 'GE_Elective': return 'GE เลือก';
                    case 'Core': return 'วิชาแกน';
                    case 'Major_Required': return 'เอกบังคับ';
                    case 'Major_Elective': return 'เอกเลือก';
                    case 'Free_Elective': return 'เลือกเสรี';
                    default: return course.category;
                  }
                } else {
                  switch(course.category) {
                    case 'GE_Required': return 'GE Req';
                    case 'GE_Elective': return 'GE Elec';
                    case 'Core': return 'Core';
                    case 'Major_Required': return 'Major Req';
                    case 'Major_Elective': return 'Major Elec';
                    case 'Free_Elective': return 'Free Elec';
                    default: return course.category.replace('_Required', ' Req').replace('_Elective', ' Elec').replace('_', ' ');
                  }
                }
              })()}
            </span>
            
            <span className="course-card-footer">
              {isCompleted ? (
                <span className="course-card-badge" style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <CheckCircleFilled style={{ fontSize: '10px' }} /> {t('card_passed')}
                </span>
              ) : isUnlocked ? (
                <span className="course-card-badge" style={{ color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <UnlockOutlined style={{ fontSize: '10px' }} /> {t('card_ready')}
                </span>
              ) : (
                <span className="course-card-badge" style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <LockOutlined style={{ fontSize: '10px' }} /> {t('card_locked')}
                </span>
              )}
            </span>
          </div>
        </Card>
      </div>
    </Tooltip>
  );
}

// Simple Divider mock to avoid import issue inside the tooltip
const Divider = ({ style }) => <div style={{ borderTop: '1px solid #e2e8f0', width: '100%', ...style }} />;
