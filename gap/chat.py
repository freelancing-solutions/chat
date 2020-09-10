import os,time,string,random
import webapp2
import jinja2
from google.appengine.ext import ndb
from google.appengine.api import users
import json
import logging

class utilities(ndb.Expando):
    _messages_limit = 100
    @staticmethod
    def create_id(size=64, chars=string.ascii_lowercase + string.digits):
        return ''.join(random.choice(chars) for x in range(size))

    @staticmethod
    def create_timestamp():
        return int(float(time.time())*1000)    
        

class ChatUsers(utilities):
    chat_id = ndb.StringProperty()
    uid = ndb.StringProperty()
    gravatar = ndb.StringProperty()
    username = ndb.StringProperty()
    online = ndb.BooleanProperty(default=False)
    last_online = ndb.IntegerProperty() # in millisecond
    chat_revoked = ndb.BooleanProperty(default=False)
    is_admin = ndb.BooleanProperty(default=False)


    def getChatUsers(self, chat_id):
        return [user.to_dict() for user in ChatUsers.query(ChatUsers.chat_id == str(chat_id).lower()).fetch()]

    def getUser(self,uid):

        chat_users_query = ChatUsers.query(ChatUsers.uid == uid)
        chat_users = chat_users_query.fetch()

        if len(chat_users) > 0:
            return  chat_users[0]
        else:
            return ''

    def addUser(self,user_details):

        chat_users_query = ChatUsers.query(ChatUsers.uid == user_details['uid'])
        chat_users_list = chat_users_query.fetch()

        if len(chat_users_list) > 0:
            chat_user = chat_users_list[0]
            if chat_user.chat_id == str(user_details['chat_id']).lower():
                return ''
            else:
                pass

        else:
            pass

        user_instance = ChatUsers()
        user_instance.chat_id = str(user_details['chat_id']).lower()
        user_instance.uid = user_details['uid']
        user_instance.gravatar = user_details['gravatar']
        user_instance.username = user_details['username']
        user_instance.online  = user_details['online']
        user_instance.last_online = user_details['last_online']
        user_instance.is_admin = user_details['is_admin']
        user_instance.chat_revoked = user_details['chat_revoked']
        user_instance.put()
        return user_instance

class ChatMessages(utilities):
    
    message_id = ndb.StringProperty()
    chat_id = ndb.StringProperty()
    uid = ndb.StringProperty()
    message = ndb.StringProperty()
    timestamp = ndb.IntegerProperty() # in millisecond
    attachments = ndb.StringProperty()
    archived = ndb.BooleanProperty(default=False)

    def getChatMessages(self, chat_id):

        # ordering messages by the order in which they where sent
        # TODO- include all limits and constants on constants utility        
        return [message.to_dict() for message in ChatMessages.query(ChatMessages.chat_id == str(chat_id).lower()).order(ChatMessages.timestamp).fetch(limit=100)]

    def addMessage(self,message_detail, chat_id):
        import time
        logging.info('adding message : {}'.format(message_detail))
        message_instance = ChatMessages()
        message_instance.message_id = self.create_id()
        message_instance.chat_id = str(message_detail['chat_id']).lower()
        message_instance.uid = message_detail['uid']
        message_instance.message = message_detail['message']
        message_instance.timestamp =  self.create_timestamp()
        message_instance.attachments = message_detail['attachments']
        message_instance.archived = message_detail['archived']
        message_instance.put()
        logging.info('message saved {}'.format(message_instance))
        return message_instance

class ChatRoom (utilities):
    chat_id = ndb.StringProperty()
    created_by = ndb.StringProperty()
    name = ndb.StringProperty()
    description = ndb.StringProperty()


  
    def getChatRoom(self,uid, chat_id):

        chat_rooms = ChatRoom.query(ChatRoom.chat_id == str(chat_id).lower()).fetch()
        if len(chat_rooms) > 0:
            chat_room = chat_rooms[0]
        else:
            chat_room = ''

        return chat_room


    def addChatRoom(self,room_detail,uid):

        chat_room_query = ChatRoom.query(ChatRoom.chat_id == str(room_detail[chat_id]).lower())
        rooms_list = chat_room_query.fetch()

        if len(rooms_list) > 0:
            return ''
        else:
            room_instance = ChatRoom()
            room_instance.chat_id = str(room_detail['chat_id']).lower()
            room_instance.created_by = uid
            room_instance.name = room_detail['name']
            room_instance.description = room_detail['description']
            room_instance.put()
            return room_instance

    def fetchAllChatRooms(self):
        chat_room_query = ChatRoom.query()
        return chat_room_query.fetch()

    def deleteChatRoom(self,uid,chat_id):
        pass


    def updateChatRoom(self,room_detail,uid,chat_id):
        pass