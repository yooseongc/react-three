function Mouse({part}) {
  return <svg className="guide-mouse" width="25" height="34" viewBox="0 0 28 38" role="img" aria-label={part==='left'?'왼쪽 클릭':part==='right'?'오른쪽 클릭':part==='wheel'?'휠':'가운데 클릭'}>
    <rect x="2" y="1" width="24" height="36" rx="11" fill="#ffffff08" stroke="#94af99" />
    {part==='left'&&<path d="M13 2C6 2 3 6 3 13v4h10Z" fill="#d3e5a5" />}
    {part==='right'&&<path d="M15 2c7 0 10 4 10 11v4H15Z" fill="#d3e5a5" />}
    <path d="M14 2v16M3 18h22" stroke="#94af99" />
    <rect x="11" y="7" width="6" height="9" rx="3" fill={part==='middle'||part==='wheel'?'#d3e5a5':'#405c48'} />
    {part==='wheel'&&<path d="m10 23 4-3 4 3m-8 5 4 3 4-3" fill="none" stroke="#d3e5a5" />}
  </svg>;
}
const Keys=({values})=><span className="guide-keys">{values.map(value=><kbd key={value}>{value}</kbd>)}</span>;
export default function ControlsGuide({touchMode}) {
  const controls=touchMode?[
    [<Keys values={['건축']} />,'탐험 ↔ 건축','켜면 설치 · 파괴 가능'],
    [<span className="touch-guide-icon">⊕</span>,'왼쪽 스틱','이동'],
    [<span className="touch-guide-icon">↔</span>,'오른쪽 드래그','둘러보기'],
    [<Keys values={['＋','−']} />,'설치 · 파괴','조준한 블록'],
    [<Keys values={['↑']} />,'점프 · 상승','길게 누르기'],
    [<Keys values={['↗','↓']} />,'비행 · 하강','비행 중 높이 조절'],
    [<Keys values={['↶','↷']} />,'취소 · 다시 실행','상단 도구'],
  ]:[
    [<Keys values={['B']} />,'탐험 ↔ 건축','켜면 설치 · 파괴 가능'],
    [<Keys values={['W','A','S','D']} />,'이동'],
    [<Keys values={['Shift','Space']} />,'달리기 · 점프'],
    [<Mouse part="left" />,'블록 파괴'],
    [<Mouse part="right" />,'블록 설치'],
    [<Mouse part="middle" />,'재료 집기'],
    [<Mouse part="wheel" />,'재료 순환'],
    [<Keys values={['F']} />,'비행 전환','Space 상승 · C 하강'],
    [<Keys values={['1–6','Q / E']} />,'재료 선택 · 페이지'],
    [<Keys values={['Ctrl Z','Ctrl Y']} />,'취소 · 다시 실행','Mac은 ⌘'],
    [<Keys values={['Esc']} />,'잠시 쉬기'],
  ];
  return <details className="controls-guide"><summary><span>조작 안내</span><span className="guide-chevron" aria-hidden="true">⌄</span></summary>
    <div className="guide-grid">{controls.map(([icon,label,hint])=><div className="guide-item" key={label}>{icon}<div><strong>{label}</strong>{hint&&<small>{hint}</small>}</div></div>)}</div>
    <div className="guide-legend"><span><i className="valid-outline" />설치 가능</span><span><i className="invalid-outline" />설치 불가</span></div>
  </details>;
}
