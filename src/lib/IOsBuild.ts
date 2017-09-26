import * as vscode from 'vscode';

import {AppceleratorBuild} from './AppceleratorBuild';

export class IOsBuild extends AppceleratorBuild {
    constructor(private info, private tiAppSetting) {
        super();
    }

    public runSimulator() {
        return AppceleratorBuild.executeAppcCommand('run --platform ios --target simulator');
    }

    public runDevice() {
        var selectedProfile;
        var devProfiles = this.info.ios.provisioning.development
            .filter(o => !o.expired && !o.invalid)
            .filter(o => this.tiAppSetting['id'].indexOf(o.appId.replace(/\*/g,"")) !== -1);
        var devNames = [];
        for (var key in this.info.ios.certs.keychains) {
            var keychain = this.info.ios.certs.keychains[key];
            keychain.developer.forEach(developer => {
                devNames.push(developer.name);
            });
        } 
        return vscode.window.showQuickPick(devProfiles.map(a => a.uuid + " " + a.name))
            .then(s => {
                selectedProfile = devProfiles.find(a => a.uuid === s.split(" ")[0]);
                return vscode.window.showQuickPick(devNames)
            })
            .then(d => {
                return this.runDeviceWithProfile(d, selectedProfile.uuid);
            });
    }

    private runDeviceWithProfile(developer, profile, device?) {
        if(device) {
            return AppceleratorBuild.executeAppcCommand('run --platform ios --target device --developer-name "' + developer + '" --pp-uuid "' + profile + '" --device-id "' + device + '"');
        }
        if (this.info.ios.devices.length === 0) {
            return this.runDeviceWithProfile(developer, profile, this.info.ios.device[0].udid)
        }
        return vscode.window.showQuickPick(this.info.ios.devices.map(a => a.name))
            .then(s => this.runDeviceWithProfile(developer, profile, this.info.ios.devices.find(a => a.name === s).udid))
    }
    
    private publishAppStore() {
        var selectedProfile;
        var devProfiles = this.info.ios.provisioning.distribution
            .filter(o => !o.expired && !o.invalid)
            .filter(o => this.tiAppSetting['id'].indexOf(o.appId.replace(/\*/g,"")) !== -1);
        var distNames = [];
        for (var key in this.info.ios.certs.keychains) {
            var keychain = this.info.ios.certs.keychains[key];
            keychain.distribution.forEach(distribution => {
                distNames.push(distribution.name);
            });
        } 
        return vscode.window.showQuickPick(devProfiles.map(a => a.uuid + " " + a.name))
            .then(s => {
                selectedProfile = devProfiles.find(a => a.uuid === s.split(" ")[0]);
                return vscode.window.showQuickPick(distNames)
            })
            .then(d => {
                return AppceleratorBuild.executeAppcCommand('run --platform ios --target dist-appstore --distribution-name "' + d + '" --pp-uuid "' + selectedProfile.uuid + '"' + ' --output-dir dist');
            });
    }
    
    private publishAdHoc() {
        var selectedProfile;
        var devProfiles = this.info.ios.provisioning.adhoc
            .filter(o => !o.expired && !o.invalid)
            .filter(o => this.tiAppSetting['id'].indexOf(o.appId.replace(/\*/g,"")) !== -1);
        return vscode.window.showQuickPick(devProfiles.map(a => a.uuid + " " + a.name))
            .then(s => {
                selectedProfile = devProfiles.find(a => a.uuid === s.split(" ")[0]);
                return AppceleratorBuild.executeAppcCommand('run --platform ios --target dist-adhoc --pp-uuid "' + selectedProfile.uuid + '"' + ' --output-dir dist');
            });
    }

    public clean() {
        return AppceleratorBuild.executeAppcCommand('ti clean --platform ios');
    }

    public run() {
        return vscode.window.showQuickPick(["simulator", "device"]).then((target) => {
            if(target=="simulator") return this.runSimulator();
            else if(target=="device") return this.runDevice();
            else vscode.window.showErrorMessage("Unknown target "+target+"!");
        });
    }

    public publish() {
        return vscode.window.showQuickPick(["dist-adhoc", "dist-appstore"]).then((target) => {
            if(target=="dist-appstore") this.publishAppStore();
            else if(target=="dist-adhoc") this.publishAdHoc();
            else vscode.window.showErrorMessage("Unknown target "+target+"!");
        });
    }
}