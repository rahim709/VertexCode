const validator = require("validator");

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const isStrongPassword = (password) => PASSWORD_REGEX.test(password);

const validate = (data)=>{

    const mandatoryField = ['firstName','emailId','password'];

    const IsAllowed = mandatoryField.every((k)=> Object.keys(data).includes(k));

    if(!IsAllowed)
        throw new Error("Some field Missing");

    if(!validator.isEmail(data.emailId))
        throw new Error("Invalid Email");

    if(!isStrongPassword(data.password))
        throw new Error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)");
}

module.exports = { validate, isStrongPassword };