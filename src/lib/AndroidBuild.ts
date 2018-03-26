import * as vscode from 'vscode';

import {AppceleratorBuild} from './AppceleratorBuild';
import {SettingManager} from '../util/SettingManager';

var path = require('path');

export class AndroidBuild extends AppceleratorBuild {
    constructor(private info) {
        super();
    }
    
    private runEmulator() {
        var emulators = this.info.android.emulators;
        //.filter(o => o.type == "avd");
        return vscode.window.showQuickPick(emulators.map(a => a.id))
            .then(deviceId => {
                return AppceleratorBuild.executeAppcCommand('run --platform android --target emulator --device-id "' + deviceId + '"');
            });
    }
    
    private runGenymotion() {
        var emulators = this.info.android.genymotion.avds
        .filter(o => o.type == "genymotion");
        return vscode.window.showQuickPick(emulators.map(a => a.id))
            .then(deviceId => {
                return AppceleratorBuild.executeAppcCommand('run --platform android --device-id "' + deviceId + '"');
            });
    }

    private runDevice() {
        return AppceleratorBuild.executeAppcCommand('run --platform android --target device');
    }

    public clean() {
        return AppceleratorBuild.executeAppcCommand('ti clean --platform android');
    }

    public run() {
        return vscode.window.showQuickPick(["emulator", "genymotion", "device"]).then((target) => {
            if(target=="emulator") return this.runEmulator();
            else if(target=="genymotion") return this.runGenymotion();
            else if(target=="device") return this.runDevice();
            else vscode.window.showErrorMessage("Unknown target "+target+"!");
        });
    }

    public publish() {
        var keystore_path, store_password, alias, key_password;

        try {
            var config = SettingManager.getConfig();
            keystore_path = config.android.publish.keystore_path;
            store_password = config.android.publish.store_password;
            alias = config.android.publish.alias;
            key_password = config.android.publish.key_password;

            if(!store_password) {
                return vscode.window.showInputBox({ prompt: "Enter store_password:", password: true}).then(_store_password => {
                    store_password = _store_password;
                    return vscode.window.showInputBox({ prompt: "Enter key-password:", password: true})
                })
                .then(_key_password => {
                    key_password = _key_password;
                    this.execPublish(keystore_path, store_password, alias, key_password);
                });
            }
            else {
                this.execPublish(keystore_path, store_password, alias, key_password);
            }
        }
        catch(e) {
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
                this.execPublish(keystore_path, store_password, alias, key_password);
                SettingManager.updateConfig({"android":{"publish":{"keystore_path":keystore_path,"alias":alias}}});
            });
        }
    }

    private execPublish(keystore_path, store_password, alias, key_password) {
        AppceleratorBuild.executeAppcCommand('run --platform android --target dist-playstore --output-dir dist'+
                            ' --keystore ' + keystore_path +
                            ' --store-password  ' +  store_password +
                            ' --alias ' + alias +
                            ' --key-password ' + (key_password || store_password));
    }
}
