import { useEffect, useRef, useState } from 'react';
import { Eraser, X } from 'lucide-react';

const Whiteboard = ({ socket, onClose }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.background = "#ffffff";
    canvas.style.borderRadius = "8px";

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.strokeStyle = "#000000"; // Default ink color
    context.lineWidth = 3;
    contextRef.current = context;

    const renderRemoteLine = (drawData) => {
      if (drawData.stop) {
        contextRef.current.closePath();
        contextRef.current.beginPath();
        return;
      }
      contextRef.current.lineTo(drawData.x, drawData.y);
      contextRef.current.stroke();
    };

    const clearCanvasLocally = () => {
      const canvas = canvasRef.current;
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      contextRef.current.beginPath();
    };
    if (socket) {
      socket.on('draw', renderRemoteLine);
      socket.on('clear-board', clearCanvasLocally);
    }

    return () => {
      if (socket) {
        socket.off('draw', renderRemoteLine);
        socket.off('clear-board', clearCanvasLocally);
      }
    };
  }, [socket]);
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = offsetX * scaleX;
    const y = offsetY * scaleY;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = nativeEvent.offsetX * scaleX;
    const y = nativeEvent.offsetY * scaleY;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();

    if (socket) {
      socket.emit('draw', { x, y });
    }
  };
  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    
    if (socket) {
      socket.emit('draw', { stop: true });
    }
  };
  const handleClear = () => {
    if (socket) {
      socket.emit('clear-board');
    }
  };

  return (
    <div className="whiteboard-container" style={{
      position: 'absolute', top: 20, left: 20, right: 20, bottom: 20,
      background: 'rgba(26, 29, 36, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      borderRadius: '16px',
      border: '1px solid var(--glass-border)',
      padding: '1rem',
      display: 'flex', flexDirection: 'column',
      zIndex: 50
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eraser size={20} /> Collaborative Whiteboard
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleClear} className="btn-outline" style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>Clear Board</button>
          <button onClick={onClose} className="icon-btn danger"><X size={20} /></button>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
