import { Component } from '@angular/core';
import { SettingService } from '../../services/setting.service';

@Component({
    selector: 'app-setting-main-component',
    templateUrl: './setting.main.component.html',
    providers: [SettingService]
})
export class SettingMainComponent {

}
