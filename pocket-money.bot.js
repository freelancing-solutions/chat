const axios = require('axios');
const config = require('config');
const templates = require('./bot_templates');



/***
 * implement a message router - which allow me to send messages to specific users only
 * @type {{message: string, response: string}[]}
 ***/


const user_directed_messages = [
    {
        message : '#admin-',
        response : ''
    },{
        message : '#group-members',
        response : ''
    }, {
        message : '#chat-members',
        response : ''
    },{
        message : '#recruits',
        response : ''
    },{
       message : '#downline',
       response : ''
    }
];


/**
 * Active Command Messages
 * this commands perform database searches on main applicatin on behalf of the user
 * therefore the command will use the users uid to complete the transaction
 * command will call main server api to complete the transaction
 * ...main server api will need a separate router with a private key to authorize the bot for this action
 **/


const active_command_message = [
    {
        message : '#active-com-balance',
        action : `/api/bot/v1/active-com/balance/`, /** {uid}/{key} **/
        response : `not yet implemented - inform admin`  /** return balance here **/
    },
    {
        message : '#active-com-affiliate-income',
        action : `/api/bot/v1/active-com/affiliate-income/`, /** {uid}/{key} **/
        response : `not yet implemented - inform admin`  /** return affiliate income here **/
    },
    {
        message : '#active-com-reserved',
        action : `/api/bot/v1/active-com/reserved-withdrawal/`, /** {uid}/{key} **/
        response: `not yet implemented - inform admin` /** return reserved for withdrawal here **/
    },
    {
        message : '#active-com-remaining-withdrawals',
        action: `/api/bot/v1/active-com/remaining-withdrawal-requests/`, /** {uid}/{key} **/
        response : `not yet implemented - inform admin` /** return remaining withdrawal-requests here **/
    },
    {
        message : '#/active-com-my-recruits',
        action: `/api/bot/v1/active-com/my-recruits/`, /** {uid}/{key} **/
        response : `not yet implemented - inform admin` /** return total number of recruits and list of recruits **/
    },
    {
        message : '#/active-com-total-recruits',
        action: `/api/bot/v1/active-com/total-recruits`, /** {uid}/{key} **/
        response: `not yet implemented - inform admin` /** return total number of recruits in your downline **/
    }
];

/***
 *
 * command_messages
 */
    const link_command_messages = [
        {
            message : '#pocket-link-home',
            response : `Pocket Money ... <a href="../"><i class="fa fa-home"> </i> Home </a>`
        },
        {
            message : '#pocket-link-about',
            response : `Pocket Money About ... <a href="../about"><i class="fa fa-info"> </i> About </a>`
        },
        {
            message : '#pocket-link-contact',
            response : `Pocket Money Affiliate How to ... <a href="../contact"><i class="fa fa-envelope"> </i> Contact </a>`
        },
        {
            message : '#pocket-link-affiliate',
            response : `Pocket Money Affiliate How to ... <a href="../affiliate-instructions"><i class="fa fa-line-chart"> </i> Affiliate How To ? </a>`
        },
        {
            message :'#pocket-link-affiliate-profiles',
            response : `Pocket Money Affiliate Profiles ... <a href="../affiliates"><i class="fa fa-users"> </i> Affiliate Profiles </a>`
        },
        {
            message : '#pocket-link-investment-plans',
            response : `Pocket Money Sample Investment Plans ... <a href="../plans/p2p-investment-plans"><i class="fa fa-bar-chart"> </i> Sample Investment Plans </a>`
        },
        {
            message :'#pocket-link-account',
            response : `Pocket Money Account ... <a href="../admin-user"><i class="fa fa-sign-in"> </i> Account </a>`
        },
        {
            message :'#pocket-link-wallet',
            response : `Pocket Money Wallet ... <a href="../admin-wallet"><i class="fa fa-google-wallet"> </i> Wallet </a>`
        },
        {
            message :'#pocket-link-deposit',
            response : `Pocket Money Deposits ... <a href="../admin-wallet-deposit"><i class="fa fa-credit-card"> </i> Deposits </a>`
        },
        {
            message :'#pocket-link-withdrawal',
            response : `Pocket Money Withdrawals ... <a href="../admin-wallet-withdraw"><i class="fa fa-credit-card"> </i> Withdrawals </a>`
        },
        {
            message :'#pocket-link-auto-investments',
            response : 'Pocket Money Auto Investments ... <a href="../auto-investments"><i class="fa fa-bar-chart"> </i> Auto Investments </a>'
        },
        {
            message :'#pocket-link-p2p-groups',
            response : 'Pocket Money P2P Groups ... <a href="../p2p-groups"><i class="fa fa-users"> </i> P2P Groups </a>'
        },
        {
            message :'#pocket-link-my-group-members',
            response : 'Pocket Money P2P Group Members ... <a href="../p2p-members"><i class="fa fa-users"> </i> My P2P Group Members </a>'
        },
        {
            message :'#pocket-link-funding-howto',
            response : 'Pocket Money Funding How to ... <a href="../p2p-instructions"><i class="fa fa-money"> </i> Funding How to ? </a>'
        },
        {
            message :'#pocket-link-edit-affiliate',
            response : 'Pocket Money Edit Affiliate Profile ... <a href="../affiliate-program/"><i class="fa fa-line-chart"> </i> Edit Affiliate Profile </a>'
        },
        {
            message :'#pocket-link-my-affiliate-profile',
            response : 'Pocket Money My Affiliate Profile ... <a href="../affiliate-program/"><i class="fa fa-line-chart"> </i> My Affiliate Profile </a>'
        },
        {
            message :'#pocket-link-blog',
            response : 'Pocket Money Blog ... <a href="../blog"><i class="fa fa-book"> </i> Blog </a>'
        },
        {
            message :'#pocket-link-create-post',
            response : 'Pocket Money Blog Guest Post ... <a href="../blog/guest-blogging"><i class="fa fa-book"> </i> Create Post </a>'
        },
        {
            message :'#pocket-link-news',
            response : `Pocket Money News ... <a href="../news"><i class="fa fa-book"> </i> News </a>`
        },
        {
            message :'#pocket-link-logout',
            response :`Pocket Money Logout ... <a href="../logout"><i class="fa fa-sign-out"> </i> Log Out </a>`
        },
        {
            message :'#pocket-link-login',
            response : `Pocket Money Login ... <a href="../login"><i class="fa fa-sign-in"> </i> Sign In </a>`
        },
        {
            message :'#pocket-link-signup',
            response : `Pocket Money Sign Up ... <a href="../signup"><i class="fa fa-link"> </i> Sign Up </a>`
        }
    ];

    const dump_map = () => {
        let map_dump = [];
        for(const link of link_command_messages ){
            map_dump.push(`${link.response}`)
        }
        return map_dump
    };

    const dump_links = () => {
        let map_dump = [];
        for(const link of link_command_messages ){
            map_dump.push(`${link.message}`)
        }
        return map_dump
    };


    const document_dumps_messages = [
        {
            message: '#docu-sitemap',
            // language=HTML
            response: `<div class="box box-warning">
                        <div class="box-header">
                            <h3 class="box-title"><i class="fa fa-sitemap"> </i> Structured Sitemap File </h3>
                        </div>
                            <ul class="list-group">
                                ${dump_map().map(list => `<li class="list-group-item">${list}</li>`)}
                            </ul>
                        </div>
                    `
        },

        {
        message : '#docu-p2p-instructions',
        response : `${templates.p2p_instructions()}`
        },
        {
            message : '#docu-link-commands',
            // language=HTML
            response : `
                <ul class="list-group">
                    ${dump_links().map(list => `<li class="list-group-item">${list} </li>`)}
                <ul>
            `
        }
];

/***
 *
 * process commands and send response to user
 */

const process_command = async (message) => {
    console.log(message);
    const internal_key = process.env.INTERNAL_KEY || config.get('INTERNAL_KEY');
    const results = {status: false, payload: {}, error: {}};
    /*** link commands ***/
    for (const com_message of link_command_messages){
        if (com_message.message === message.message.toLowerCase().trim()){
            results.payload = `${com_message.response} -- ${com_message.message}`
        }
    }

    /*** document dumps ***/
    for (const com_message of document_dumps_messages){
        if (com_message.message === message.message.toLowerCase().trim()){
            results.payload = com_message.response
        }
    }
    /*** action messages **/
    for (const com_action of active_command_message){
        if (com_action.message === message.message.toLowerCase().trim()){
            console.log('inside active command',message);
            await perform_active_command_action(message.uid,`${com_action.action}${message.uid}/${internal_key}`).then(response => {

                console.log('message : ',response.payload);
                results.payload = response.payload

            }).catch(error => {
                results.payload = `${message.message} : error : ${error.message}`
            })
        }
    }

    return results.payload;
};


/*** function to perform active commands actions ***/

const perform_active_command_action = async (uid,action_url) => {
    let results = {status: false, payload : {}, error: {}};
    const base_url = config.get('BASE_URL') || process.env.BASE_URL ;
    const request_url = base_url + action_url;


    await axios.get(request_url).then(response => {
        if(response.status === 200){
            return response.data;
        }
        throw new Error('error perfoming active command action')
    }).then(response => {
        console.log('AXIOS RESPONSE', response);
        results = {...response}
    }).catch(error => {
        results.status = false;
        results.error =  {...error};

    });

    return results;
};


module.exports = {
    process_command : process_command
};