/*
 MIT License

 Copyright (c) 2019 Temainfo Software

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
import {
  Component, ElementRef, EventEmitter, Input, Renderer2, ViewChild, Output, AfterViewInit,
  OnDestroy, OnInit
} from '@angular/core';
import { ChatStatus } from './interfaces/chat-status.interface';
import { ChatContact } from './interfaces/chat-contact.interface';
import { ChatMessage } from './interfaces/chat-message.interface';
import { Status } from './enums/status.enum';
import { Subscription } from 'rxjs';
import { ChatService } from './services/chat.service';
import { I18nService } from '../i18n/i18n.service';

let uniqueIdentifier = 0;

@Component( {
  selector: 'tl-chatlist',
  templateUrl: './chatlist.html',
  styleUrls: [ './chatlist.scss' ],
} )
export class TlChatList implements OnInit, AfterViewInit, OnDestroy {

  @Input() maxHeight = '450px';

  @Input() width = '400px';

  @Input() color = 'basic';

  @Input() loadingMessages = false;

  @Input() chatStatus: ChatStatus = {
    BUSY: '#ffc019',
    ONLINE: '#66cc99',
    OFFLINE: '#ff3100'
  };

  @Input() partner: ChatContact;

  @Input() id = `tl-chatlist-${uniqueIdentifier++}`;

  @Input() user: ChatContact;

  @Input('contacts')
  set contacts( data: ChatContact[] ) {
    if (data && data.length > 0 && this.user) {
      if (!this.user.id) {
        throw Error('User id not found');
      }
      this._dataSource = data.filter((item) => item.id !== this.user.id);
    }
  }

  get contacts(): ChatContact[] {
    return this._dataSource;
  }

  @Output() readMessage: EventEmitter<ChatMessage[]> = new EventEmitter();

  @Output() sendMessage: EventEmitter<ChatMessage> = new EventEmitter();

  @Output() changeStatus: EventEmitter<any> = new EventEmitter();

  @Output() newMessages: EventEmitter<boolean> = new EventEmitter();

  @Output() selectContact: EventEmitter<any> = new EventEmitter();

  @ViewChild('content', {static: false} ) content: ElementRef;

  public transform = '0';

  public selected = 'ONLINE';

  public noContactsFound = this.i18nService.getLocale().ChatList.noContactsFound;

  public searchContact = this.i18nService.getLocale().ChatList.searchContact;

  public insideChat = false;

  public filterControl = '';

  private _dataSource;

  private subscription = new Subscription();

  constructor(private renderer: Renderer2, private chatService: ChatService, private i18nService: I18nService ) {}

  get online() {
    return Status.ONLINE;
  }

  get offline() {
    return Status.OFFLINE;
  }

  get busy() {
    return Status.BUSY;
  }

  ngOnInit() {
    this.chatService.changeStatus.subscribe(( value: { chatId: string, status: Status } ) => {
      if ( value.chatId === this.id ) {
        this.setStatus( value.status );
      }
    });
  }

  ngAfterViewInit() {
    this.chatService.createChat(this.id);
  }

  get messages() {
    return this.chatService.getAllMessages(this.id);
  }

  animationContentDone(event: AnimationEvent) {
    if (event.animationName === 'showOffContent') {
      this.insideChat = true;
    }
  }

  getUnreadMessages(item: ChatContact) {
    if (!item || !item.id) {
      return [];
    }
    if (this.messages.length > 0) {
      return this.messages.filter((message: ChatMessage) => {
        if ( message.from && message.to ) {
         return (!message.viewed && message.from.id === item.id) && (message.to.id === this.user.id);
        }
      });
    }
    return [];
  }

  getFilter( statusSelected ) {
    if (statusSelected === this.offline) {
      return { filter: this.filterControl, status: [this.offline] };
    }
    return { filter: this.filterControl, status: [this.online, this.busy] };
  }

  trackByFn(index) {
    return index;
  }

  selectPartner(item: ChatContact) {
    this.updatePartner(item);
    this.selectContact.emit({ ...item, unreadMessages: this.getUnreadMessages(item) });
    this.renderer.setStyle(this.content.nativeElement, 'animation', 'showOffContent 0.2s forwards');
    this.chatService.readMessages( this.getUnreadMessages(item), this.id );
  }

  updatePartner(item: ChatContact) {
    this.partner = item;
  }

  setStatus(status: Status) {
    this.changeStatus.emit({ user: this.user, status: status });
  }

  onMessage(message: { value: string, time: Date }) {
    const msm = {
      to: this.partner,
      from: this.user,
      message: message.value,
      time: message.time,
      viewed: false
    };
    this.sendMessage.emit(msm);
  }

  selectStatus(status) {
    if (status === 'ONLINE') {
      this.transform = '0';
      this.selected = 'ONLINE';
    } else if (status === 'OFFLINE') {
      this.transform = '100px';
      this.selected = 'OFFLINE';
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.chatService.removeChat( this.id );
  }

}

