const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const crypto = require('crypto');
console.log('init')
try {
    const time = (new Date()).toTimeString();
    core.setOutput("started at", time);
    core.info("started at", time)

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
        },
        timeout: 2000
    }

    const body = {
        email: email,
        password: password
    }
    core.setOutput('log as', email);
    console.log(body);

    axios.post(loginUrl, body).then((resp) => {
        core.setOutput('step', 'auth on S4 option')
        console.log(resp.data);

        if (resp.data.auth === true) {
            core.setOutput('S4 Auth', 'success')
            console.log('auth')
            console.log(resp.data);
        } else {
            core.setOutput('S4 Auth', 'error')
            console.log('not auth')
            core.setFailed(resp.data.message);
            process.exit(1);
        }

        console.log('send payload')
        console.log(payload);

        axios.post(payloadUrl, payload, options).then((resps) => {
            core.setOutput('step', 'send payload to S4')
            console.log(resps.data);

            if (resps.status === 200) {
                if (resps.data.isVul === false) {
                    console.log(resps.data.message);
                } else {
                    console.log('not vul')
                    core.setFailed(resps.data.message);
                }
            } else {
                console.log('send payload failed')
                core.setFailed(resps.data.message);
            }
        }).catch((err) => {
            console.error(err.message)
            core.setFailed(err.message);
        })
    })
        .catch((err)=> {
            console.error(err.message)
            core.setFailed(err.message);
        });
}
catch (error) {
    console.error(error.message);
    core.setFailed(error.message);
}
