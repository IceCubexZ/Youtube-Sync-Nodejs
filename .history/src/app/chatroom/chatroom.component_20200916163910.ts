import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from './../user.service';
import { WebsocketService } from './../websocket.service';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css']
})
export class ChatroomComponent implements OnInit {
  private username: String;
  private email: String;
  private chatroom;
  private message: String;
  messageArray: Array<{user: String, message: String}> = [];
  private isTyping = false;
  public YT: any;
  public video: any;
  public player: any;
  public reframed: Boolean = false;

  constructor(
    private route: ActivatedRoute,
    private webSocketService: WebsocketService,
    private userService: UserService,
    private router: Router
  ) {
    this.webSocketService.newMessageReceived().subscribe(data => {
      this.messageArray.push(data);
      this.isTyping = false;
      this.video = this.getVideoID(this.messageArray[0].message);
      this.init();
      if (data.message === '!play'){
        this.player.playVideo();
      }
    });
    this.webSocketService.receivedTyping().subscribe(bool => {
      this.isTyping = bool.isTyping;
    });
  }

  init() {
    // Return if Player is already created
    if (window['YT']) {
      this.startVideo();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    /* 3. startVideo() will create an <iframe> (and YouTube player) after the API code downloads. */
    window['onYouTubeIframeAPIReady'] = () => this.startVideo();
  }

  ngOnInit() {
    this.username = this.route.snapshot.queryParamMap.get('name');
    this.email = this.route.snapshot.queryParamMap.get('email');
    const currentUser = this.userService.getLoggedInUser();
    if ( currentUser.username < this.username) {
      this.chatroom = currentUser.username.concat(this.username);
    } else {
      this.chatroom = this.username.concat(currentUser.username);
    }
    this.webSocketService.joinRoom({user: this.userService.getLoggedInUser().username, room: this.chatroom});
    this.userService.getChatRoomsChat(this.chatroom).subscribe(messages => {
      this.messageArray = messages.json();
    });

  }

  sendMessage() {
    this.webSocketService.sendMessage({room: this.chatroom, user: this.userService.getLoggedInUser().username, message: this.message});
    this.message = '';
  }

  typing() {
    this.webSocketService.typing({room: this.chatroom, user: this.userService.getLoggedInUser().username});
  }

  startVideo(): void {
    this.reframed = false;
    this.player = new window['YT'].Player('player', {
      videoId: this.video,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        controls: 1,
        disablekb: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        playsinline: 1

      },
    });
  }

  cleanTime() {
    return Math.round(this.player.getCurrentTime());
  }

  getVideoID(id): string {
    let videoID = id.split('v=')[1];
    let x = videoID.indexOf('&');
    if (x !== -1) {
      videoID = videoID.substring(0, x);
      return videoID;
    }
  }

}
