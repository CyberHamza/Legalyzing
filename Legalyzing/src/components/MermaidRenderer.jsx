import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#4f46e5',
        lineColor: '#8b5cf6',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff'
    },
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif'
});

let idCount = 0;

const MermaidRenderer = ({ chart }) => {
    const [svg, setSvg] = useState('');
    const id = useRef(`mermaid-${idCount++}`);

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                // Generate a unique ID for each render to avoid conflicts
                const { svg } = await mermaid.render(id.current, chart);
                setSvg(svg);
            } catch (error) {
                console.error('Mermaid Render Error:', error);
                setSvg('<p style="color: red;">Failed to render diagram. Check Mermaid syntax.</p>');
            }
        };

        if (chart) {
            renderDiagram();
        }
    }, [chart]);

    return (
        <div 
            style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                margin: '20px 0',
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                minHeight: '100px'
            }} 
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
};

export default MermaidRenderer;
