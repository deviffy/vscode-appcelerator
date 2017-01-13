import * as vscode from 'vscode';

import {AndroidBuild} from './AndroidBuild';
import {IOsBuild} from './IOsBuild';

var shell = require('shelljs');
var project_flag = ' --project-dir "' + vscode.workspace.rootPath +'"';

export class AppceleratorBuild {
    constructor() {

    }

    static executeAppcCommand(cmd) {
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
}