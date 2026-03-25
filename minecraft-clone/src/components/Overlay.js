import { useEffect, useState } from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  zIndex: 1000,
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const titleStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
};

const tableStyle = {
  borderCollapse: 'collapse',
  fontSize: '1rem',
  lineHeight: '2',
};

const keyStyle = {
  padding: '0.2rem 0.6rem',
  margin: '0 0.3rem',
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.3)',
  fontFamily: 'monospace',
  fontSize: '0.9rem',
};

const tdLabelStyle = {
  textAlign: 'right',
  paddingRight: '1rem',
  color: 'rgba(255,255,255,0.7)',
};

const hintStyle = {
  marginTop: '2.5rem',
  fontSize: '0.9rem',
  color: 'rgba(255,255,255,0.5)',
};

function Key({ children }) {
  return <span style={keyStyle}>{children}</span>;
}

export default function Overlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function onLockChange() {
      setVisible(!document.pointerLockElement);
    }
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  if (!visible) return null;

  return (
    <div style={overlayStyle}>
      <div style={titleStyle}>Minecraft Clone</div>
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={tdLabelStyle}>Move</td>
            <td><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key></td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Jump</td>
            <td><Key>Space</Key></td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Look</td>
            <td>Mouse</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Place block</td>
            <td>Click</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Remove block</td>
            <td><Key>Alt</Key> + Click</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Select block</td>
            <td><Key>1</Key><Key>2</Key><Key>3</Key><Key>4</Key><Key>5</Key></td>
          </tr>
        </tbody>
      </table>
      <div style={hintStyle}>Click anywhere to start</div>
    </div>
  );
}
