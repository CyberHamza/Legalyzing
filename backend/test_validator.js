try {
    console.log('Testing strict import...');
    const { body, validationResult } = require('express-validator');
    console.log('Success: body is', typeof body);
} catch (e) {
    console.error('Failed strict import:', e);
}
