import * as vscode from 'vscode';

import {AppceleratorBuild} from './AppceleratorBuild';

var path = require('path');

export class AndroidBuild extends AppceleratorBuild {
    constructor() {
        super();
    }
    
    private runSimulator() {
        return AppceleratorBuild.executeAppcCommand('run --platform android --target emulator');
    }

    private runDevice() {
        return AppceleratorBuild.executeAppcCommand('run --platform android --target device');
    }

    public clean() {
        return AppceleratorBuild.executeAppcCommand('ti clean --platform android');
    }

    public run() {
        return vscode.window.showQuickPick(["simulator", "device"]).then((target) => {
            if(target=="simulator") return this.runSimulator();
            else if(target=="device") return this.runDevice();
            else vscode.window.showErrorMessage("Unknown target "+target+"!");
        });
    }

    public publish() {
        var keystore_path, store_password, alias, key_password;
        return vscode.window.showInputBox({ prompt: "Enter keystore path:"}).then(_path => {
            keystore_path = path.resolve(vscode.workspace.rootPath,_path);
            console.log(keystore_path);
            return vscode.window.showInputBox({ prompt: "Enter store_password:", password: true})
        })
        .then(_store_password => {
            store_password = _store_password;
            return vscode.window.showInputBox({ prompt: "Enter alias:"})
        }).then(_alias => {
            alias = _alias;
            return vscode.window.showInputBox({ prompt: "Enter key-password:", password: true})
        })
        .then(_key_password => {
            key_password = _key_password;
            AppceleratorBuild.executeAppcCommand('run --platform android --target dist-playstore --output-dir dist'+
                                  ' --keystore ' + keystore_path +
                                  ' --store-password  ' +  store_password +
                                  ' --alias ' + alias +
                                  ' --key-password ' + (key_password || store_password));
        });
    }
}