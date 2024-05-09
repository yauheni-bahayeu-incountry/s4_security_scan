const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const crypto = require('crypto');
console.log('init')
try {
    const email = core.getInput('username');
    const password = core.getInput('password');
    const loginUrl = core.getInput('loginUrl');
    const payloadUrl = core.getInput('payloadUrl');
    const webhookSecret = core.getInput('webhookSecret');
    console.log(email)
    let payload = JSON.stringify(github.context.payload, undefined, 2)
    payload = JSON.parse(payload);
    payload.email = email;

    const hmac = crypto.createHmac('sha1', webhookSecret);
    const self_signature = hmac.update(JSON.stringify(payload)).digest('hex');
    console.log('headers')
    const options = {
        headers: {
            'x-hub-signature': 'sha1='+self_signature
        }
    }

    var body = {
        email: email,
        password: password
    }
    console.log(body)
    axios.post(loginUrl, body).then((resp) => {
        console.log(resp)
        if (resp.data.auth == true) {
            console.log(resp.data.message);
        }else
        {
            core.setFailed(resp.data.message);
            process.exit(1);
        }

        axios.post(payloadUrl, payload, options).then((resps) => {
            console.log(resps)
            if(resps.status == 200) {
                if(resps.data.isVul === false) {
                    console.log(resps.data.message);
                }
                else {
                    core.setFailed(resps.data.message);
                }
            }else {
                core.setFailed(resps.data.message);
            }
        }).catch((err) => {
            console.error(err)
            core.setFailed(err.message);
        })
    })
        .catch((err)=> {
            console.error(err)
            core.setFailed(err.message);
        })
}
catch (error) {
    console.error(error)
    core.setFailed(error.message);
}
