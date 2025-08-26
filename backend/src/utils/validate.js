const rules = {
    email: {
        regex: /^[\w\-\+]+(\.?[\w\-\+]+)*@(?:\w(?:[\w\-]*\w)?)(?:\.\w(?:[\w\-]*\w)?)*\.[a-zA-Z]{2,}$/,
        errMsg: "Invalid email format"
    },
    password: {
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-\[\]{}|:;<>,\.\?\/~]).{8,}$/,
        errMsg: "Invalid password format"
    }
}
export default function validate(msg, type){
    if (!rules[type]){
//        console.error("Wrong type")
        return {valid: false, msg:"unknown type"};
    }
    const isValid = rules[type].regex.test(msg);
//    console.log("Good type", isValid);
    return {
        valid: isValid,
        msg: isValid ? null : rules[type].errMsg };
}