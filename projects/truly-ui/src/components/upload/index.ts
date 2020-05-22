import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TlUpload } from './upload';
import { IconsModule } from '../icons/index';
import { LightboxModule } from '../lightbox/index';
import { HttpClientModule } from '@angular/common/http';
import { TextareaModule } from '../textarea/index';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IconsModule,
    LightboxModule,
    HttpClientModule,
    TextareaModule
  ],
  declarations: [
    TlUpload
  ],
  exports: [
    TlUpload
  ]
})
export class UploadModule {}