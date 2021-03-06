const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email.match(emailRegEx);
};

const isEmpty = (string) => {
    return string.trim() === '';
};

exports.validateSignUpData = (data) => {
    let errors = {};
    if (isEmpty(data.email)) {
        errors.email = 'Must not be empty';
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be a valid email address';
    }
    if (isEmpty(data.password)) {
        errors.password = 'Must not be empty';
    }
    if (data.password !== data.confirmPassword) {
        errors.password = 'Passwords must match';
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
};

exports.validateLoginData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) errors.email = "Must not be empty";
    if (isEmpty(data.password)) errors.password = "Must not be empty";

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
};

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    Object.keys(data).forEach(function (item) {
        if (!isEmpty(data[item].trim())) userDetails[item] = data[item];
    });

    return userDetails
};