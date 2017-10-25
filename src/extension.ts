'use strict';

import * as vscode from 'vscode';

import {AppceleratorBuild} from './lib/AppceleratorBuild';
import {AndroidBuild} from './lib/AndroidBuild';
import {IOsBuild} from './lib/IOsBuild';
import {SettingManager} from './util/SettingManager';

var shell = require('shelljs');
var info;
var tiAppSetting;

function createAppcPromise(cmd) {
    var appcPromise =  new Promise((resolve, reject) => {
        AppceleratorBuild.executeAppcCommandSilent(cmd, function(code, output) {
            if (code === 0) {
                try {
                    resolve(JSON.parse(output));
                }
                catch(err) {
                    console.log(err);
                    reject(output);
                }
            } else {
                console.log(output);
                reject(output);
            }
        })
    });
    return appcPromise;
}

function init(silent = true) {
    info = void 0;
    tiAppSetting = void 0;
    console.log('Initializing "vscode-appcelerator" extension...');
    createAppcPromise('ti project -o json --project-dir "'+vscode.workspace.rootPath +'"')
    .then((_tiAppSetting) => {
        console.log('Extension "vscode-appcelerator": tiAppSetting loaded!');
        tiAppSetting = _tiAppSetting;
    }).catch((err) => {
        return vscode.window.showErrorMessage(err);
    });
    createAppcPromise('info -o json')
    .then((_info) => {
        console.log('Extension "vscode-appcelerator": info loaded!');
        info = _info;
        if(!silent) vscode.window.showInformationMessage('Extension "vscode-appcelerator" ready!');
    }).catch((err) => {
        return vscode.window.showErrorMessage(err);
    });
}

function login() {
    console.log("login");
    var username, password, organization;

    try {
        var config = SettingManager.getConfig();
        username = config.appcelerator.username;
        password = config.appcelerator.password;
        organization = config.appcelerator.organization;

        if(!password) {
            return vscode.window.showInputBox({ prompt: "Enter password:", password: false}).then(_password => {
                password = _password;
                execLogin(username, password, organization);
            });
        }
        else {
            execLogin(username, password, organization);
        }
    }
    catch(e) {
        return vscode.window.showInputBox({ prompt: "Enter username:", password: false}).then(_username => {
            username = _username;
            return vscode.window.showInputBox({ prompt: "Enter password:", password: true})
        })
        .then(_password => {
            password = _password;
            return vscode.window.showInputBox({ prompt: "Enter organization id (leave blank if no organization):", password: false})
        })
        .then(_organization => {
            organization = _organization;
            SettingManager.updateConfig({"appcelerator":{"username":username,"organization":organization}});
            execLogin(username, password, organization);
        });
    }
}

function execLogin(username, password, organization) {
    var cmd = organization.length>0?'login --username "'+username+'" --password "'+password+'" -O "'+organization+'"':'login --username "'+username+'" --password "'+password+'"';
   
    AppceleratorBuild.executeAppcCommandSilent(cmd, function(code, output) {
        console.log("execLogin",code, output);
        if (code === 0) {
            try {
                console.log(output);
                return vscode.window.showInformationMessage("Login done!");
            }
            catch(err) {
                console.log(err);
                return vscode.window.showErrorMessage(err);
            }
        } else {
            console.log(output);
            return vscode.window.showErrorMessage("Error: "+code);
        }
    });   
}

function selectBuild() {
    return new Promise((resolve, reject) => {
        if(tiAppSetting) {
            var targets = Object.keys(tiAppSetting["deployment-targets"]).filter(target=>tiAppSetting["deployment-targets"][target]);
            resolve(vscode.window.showQuickPick(targets));
        }
        else vscode.window.showErrorMessage('Extension is not ready, please try again later!');
    }).then<AppceleratorBuild>((platform) => {
        if(platform === "android") return new AndroidBuild(info);
        else if(platform == "iphone" || platform == "ipad") {
            if(info) return new IOsBuild(info, tiAppSetting);
            else throw new Error('Extension is not ready, please try again later!');
        }
        else throw new Error("Unknown platform "+platform+"!");
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.init', () => {
        return init(false);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.run', () => {
        vscode.workspace.saveAll();
        return selectBuild().then((platformBuild) => {
            return platformBuild.run();
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.publish', () => {
        vscode.workspace.saveAll();
        return selectBuild().then((platformBuild) => {
            return platformBuild.publish();
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.clean', () => {
        return selectBuild().then((platformBuild) => {
            return platformBuild.clean();
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.login', () => {
        return login();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.lastCmd', () => {
        return AppceleratorBuild.executeLastAppcCommand();
    }));

    init(true);
}

// this method is called when your extension is deactivated
export function deactivate() {
}