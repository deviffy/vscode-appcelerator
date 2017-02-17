import * as vscode from 'vscode';

import {AndroidBuild} from './AndroidBuild';
import {IOsBuild} from './IOsBuild';

var shell = require('shelljs');
var project_flag = ' --project-dir "' + vscode.workspace.rootPath +'"';
var config_file = vscode.workspace.rootPath+'/dist/vscode-appcelerator.config.json';
var lastCmd;

export abstract class AppceleratorBuild {

    static getConfigFile() {
        return config_file;
    }

    static executeAppcCommand(cmd) {
        lastCmd = cmd;
        let channel = vscode.window.createOutputChannel("appcelerator");
        let command = 'cd "' + vscode.workspace.rootPath + '" && appc ' + cmd + project_flag;
        console.log(command);
        var appc_command = shell.exec(command, {async: true});
        appc_command.stdout.on('data', function(data) {
            channel.append(data);
        });
        appc_command.stderr.on('data', function(data) {
            channel.append(data);
        });
        return new Promise((resolve, reject) => {
            channel.show()
            resolve();
        });
    }

    static executeAppcCommandSilent(cmd, callback) {
        let command = 'cd "' + vscode.workspace.rootPath + '" && appc ' + cmd;
        console.log(command);
        return shell.exec(command, callback);
    }

    static executeLastAppcCommand() {
        if(lastCmd) return AppceleratorBuild.executeAppcCommand(lastCmd);
        else return new Promise((resolve, reject) => {
            reject("No command to execute!");
        });
    }

    abstract run();
    abstract publish();
    abstract clean();
}