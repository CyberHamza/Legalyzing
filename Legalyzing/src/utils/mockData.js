// Mock chat conversations
export const mockChats = [
    {
        id: 1,
        title: 'NDA Document Help',
        timestamp: '2 hours ago',
        messages: [
            { role: 'user', content: 'I need help creating an NDA document' },
            { role: 'assistant', content: 'I can help you create a Non-Disclosure Agreement. Would you like to use our NDA template or do you have specific requirements?' }
        ]
    },
    {
        id: 2,
        title: 'Employment Contract Query',
        timestamp: '1 day ago',
        messages: [
            { role: 'user', content: 'What should be included in an employment contract?' },
            { role: 'assistant', content: 'An employment contract should include: job title, responsibilities, compensation, benefits, work schedule, termination clauses, and confidentiality agreements.' }
        ]
    },
    {
        id: 3,
        title: 'Lease Agreement Review',
        timestamp: '3 days ago',
        messages: []
    }
];

// Document templates
export const documentTemplates = [
    {
        id: 'house-rent',
        name: 'House Rent Agreement',
        description: 'Residential Lease Agreement',
        icon: 'HomeIcon',
        fields: [
            { name: 'landlordName', label: 'Landlord Name', type: 'text', required: true },
            { name: 'landlordFatherName', label: "Landlord's Father Name", type: 'text', required: true },
            { name: 'landlordAddress', label: 'Landlord Address', type: 'textarea', required: true },
            { name: 'companyName', label: 'Company Name (Lessee)', type: 'text', required: true },
            { name: 'directorName', label: 'Director Name', type: 'text', required: true },
            { name: 'propertyAddress', label: 'Property Address', type: 'textarea', required: true },
            { name: 'monthlyRent', label: 'Monthly Rent Amount', type: 'number', required: true },
            { name: 'leaseStartDate', label: 'Lease Start Date', type: 'date', required: true },
            { name: 'dateOfAgreement', label: 'Date of Agreement', type: 'date', required: true },
            { name: 'signingPlace', label: 'Place of Signing', type: 'text', required: true },
            { name: 'signingDate', label: 'Date of Signing', type: 'date', required: true },
            { name: 'witness1Name', label: 'Witness 1 Name', type: 'text', required: true },
            { name: 'witness2Name', label: 'Witness 2 Name', type: 'text', required: true }
        ]
    },
    {
        id: 'employment-contract',
        name: 'Employment Contract',
        description: 'Employee Agreement',
        icon: 'WorkIcon',
        fields: [
            { name: 'employerName', label: 'Employer Name', type: 'text', required: true },
            { name: 'employeeName', label: 'Employee Name', type: 'text', required: true },
            { name: 'position', label: 'Job Position', type: 'text', required: true },
            { name: 'salary', label: 'Annual Salary', type: 'number', required: true },
            { name: 'startDate', label: 'Start Date', type: 'date', required: true },
            { name: 'benefits', label: 'Benefits Package', type: 'textarea', required: true },
            { name: 'workHours', label: 'Work Hours per Week', type: 'number', required: true }
        ]
    },
    {
        id: 'nda',
        name: 'NDA Document',
        description: 'Non-Disclosure Agreement',
        icon: 'DescriptionIcon',
        fields: [
            { name: 'disclosingParty', label: 'Disclosing Party Name', type: 'text', required: true },
            { name: 'receivingParty', label: 'Receiving Party Name', type: 'text', required: true },
            { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
            { name: 'terminationDate', label: 'Termination Date', type: 'date', required: true },
            { name: 'confidentialInfo', label: 'Confidential Information Scope', type: 'textarea', required: true },
            { name: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', required: true }
        ]
    },
    {
        id: 'partnership-deed',
        name: 'Partnership Agreement',
        description: 'Business Partnership Contract',
        icon: 'HandshakeIcon',
        fields: [
            { name: 'partner1', label: 'Partner 1 Name', type: 'text', required: true },
            { name: 'partner2', label: 'Partner 2 Name', type: 'text', required: true },
            { name: 'businessName', label: 'Business Name', type: 'text', required: true },
            { name: 'capitalContribution', label: 'Capital Contribution Details', type: 'textarea', required: true },
            { name: 'profitSharing', label: 'Profit Sharing Ratio', type: 'text', required: true },
            { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true }
        ]
    },
    {
        id: 'sale-deed',
        name: 'Sale Deed',
        description: 'Property Sale Agreement',
        icon: 'ShoppingCartIcon',
        fields: [
            { name: 'seller', label: 'Seller Name', type: 'text', required: true },
            { name: 'buyer', label: 'Buyer Name', type: 'text', required: true },
            { name: 'propertyDescription', label: 'Property Description', type: 'textarea', required: true },
            { name: 'salePrice', label: 'Sale Price', type: 'number', required: true },
            { name: 'paymentTerms', label: 'Payment Terms', type: 'textarea', required: true },
            { name: 'closingDate', label: 'Closing Date', type: 'date', required: true }
        ]
    }
];

// Generated documents (mock)
export const generatedDocuments = [
    {
        id: 1,
        name: 'NDA_TechCorp_2024.pdf',
        type: 'NDA Document',
        date: '2024-11-25',
        size: '245 KB'
    },
    {
        id: 2,
        name: 'Employment_Contract_JohnDoe.pdf',
        type: 'Employment Contract',
        date: '2024-11-20',
        size: '189 KB'
    }
];

// User profile (mock)
export const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null
};
