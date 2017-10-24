'use strict';

import * as vscode from 'vscode';

import {AppceleratorBuild} from './lib/AppceleratorBuild';
import {AndroidBuild} from './lib/AndroidBuild';
import {IOsBuild} from './lib/IOsBuild';

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
        vscode.window.showInformationMessage('Please use vscode View > Integrated Terminal and type \'appc login\'!');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.lastCmd', () => {
        return AppceleratorBuild.executeLastAppcCommand();
    }));

    init(true);
}

// this method is called when your extension is deactivated
export function deactivate() {
}