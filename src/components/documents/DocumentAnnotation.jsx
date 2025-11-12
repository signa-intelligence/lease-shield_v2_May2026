import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Type,
  Highlighter,
  Square,
  Circle,
  Eraser,
  Download,
  X,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save
} from "lucide-react";

export default function DocumentAnnotation({ imageUrl, onSave, onClose, colors, language = 'en' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#EF4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [zoom, setZoom] = useState(1);

  const t = {
    en: {
      title: "Annotate Document",
      pen: "Pen",
      highlighter: "Highlight",
      text: "Text",
      rectangle: "Rectangle",
      circle: "Circle",
      eraser: "Eraser",
      save: "Save",
      cancel: "Cancel",
      undo: "Undo",
      redo: "Redo",
      download: "Download",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
    },
    th: {
      title: "เขียนบันทึกเอกสาร",
      pen: "ปากกา",
      highlighter: "ไฮไลท์",
      text: "ข้อความ",
      rectangle: "สี่เหลี่ยม",
      circle: "วงกลม",
      eraser: "ยางลบ",
      save: "บันทึก",
      cancel: "ยกเลิก",
      undo: "ย้อนกลับ",
      redo: "ทำซ้ำ",
      download: "ดาวน์โหลด",
      zoomIn: "ขยาย",
      zoomOut: "ย่อ",
    }
  };

  const strings = t[language];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      saveToHistory();
    };
  }, [imageUrl]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'highlighter' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep + 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataUrl);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `annotated_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools = [
    { id: 'pen', icon: Pencil, label: strings.pen },
    { id: 'highlighter', icon: Highlighter, label: strings.highlighter },
    { id: 'rectangle', icon: Square, label: strings.rectangle },
    { id: 'circle', icon: Circle, label: strings.circle },
    { id: 'eraser', icon: Eraser, label: strings.eraser },
  ];

  const colorOptions = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* Toolbar */}
      <div className="p-4 border-b shadow-md" style={{ 
        backgroundColor: colors.cardBg,
        borderBottomColor: colors.borderColor 
      }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-lg" style={{ color: colors.textPrimary }}>{strings.title}</h2>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tools */}
            {tools.map((t) => {
              const ToolIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: tool === t.id ? '#0C3B2E' : colors.fieldBg,
                    color: tool === t.id ? '#FFFFFF' : colors.textPrimary,
                    border: `2px solid ${tool === t.id ? '#0C3B2E' : colors.borderColor}`,
                  }}
                  title={t.label}
                >
                  <ToolIcon className="w-4 h-4" />
                </button>
              );
            })}

            {/* Colors */}
            <div className="flex gap-1 ml-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#0C3B2E' : 'transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* History */}
            <div className="flex gap-1 ml-2">
              <button
                onClick={handleUndo}
                disabled={historyStep <= 0}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: colors.fieldBg,
                  color: colors.textPrimary,
                  opacity: historyStep <= 0 ? 0.5 : 1,
                  cursor: historyStep <= 0 ? 'not-allowed' : 'pointer',
                }}
                title={strings.undo}
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: colors.fieldBg,
                  color: colors.textPrimary,
                  opacity: historyStep >= history.length - 1 ? 0.5 : 1,
                  cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer',
                }}
                title={strings.redo}
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {strings.download}
              </Button>
              <Button onClick={handleSave} size="sm" className="bg-ls-forest hover:bg-ls-forest/90">
                <Save className="w-4 h-4 mr-2" />
                {strings.save}
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center" style={{ backgroundColor: '#0000000D' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="cursor-crosshair shadow-2xl"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  );
}