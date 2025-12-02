const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

console.log('Type of pdf:', typeof pdf);
console.log('pdf keys:', Object.keys(pdf));
console.log('pdf.default:', pdf.default);

const pdfFunc = pdf.default || pdf;

const createDummyPDF = () => {
    const filePath = path.join(__dirname, 'test.pdf');
    const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Hello World) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000240 00000 n
0000000327 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
421
%%EOF`;
    fs.writeFileSync(filePath, content);
    return filePath;
};

const test = async () => {
    try {
        const pdfPath = createDummyPDF();
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        console.log('Text:', data.text);
        fs.unlinkSync(pdfPath);
    } catch (error) {
        console.error('Error:', error);
    }
};

test();
