import os,time,string,random
import webapp2
import jinja2
from google.appengine.ext import ndb
from google.appengine.api import users
import json
import logging
SIMPLE_TYPES = (int, long, float, bool, dict, basestring, list)

class Utilities(ndb.Expando):
    _max_query_limit = 10000
    _messages_limit = 100

    _results = {'status': False, 'payload' : {}, 'error': {}}
    
    @staticmethod
    def create_id(size=64, chars=string.ascii_lowercase + string.digits):
        return ''.join(random.choice(chars) for x in range(size))

    @staticmethod
    def create_timestamp():
        return int(float(time.time())*1000)    
        

class ChatUsers(Utilities):
    chat_id = ndb.StringProperty()
    uid = ndb.StringProperty()
    gravatar = ndb.StringProperty()
    username = ndb.StringProperty()
    online = ndb.BooleanProperty(default=False)
    last_online = ndb.IntegerProperty() # in millisecond
    chat_revoked = ndb.BooleanProperty(default=False)
    is_admin = ndb.BooleanProperty(default=False)

    @staticmethod
    def get_chat_users(chat_id):
        return [user.to_dict() for user in ChatUsers.query(ChatUsers.chat_id == str(chat_id).lower()).fetch()]

    @staticmethod
    def get_user(uid):

        chat_users_query = ChatUsers.query(ChatUsers.uid == uid)
        chat_users = chat_users_query.fetch()

        if len(chat_users) > 0:
            return chat_users[0]
        else:
            return ''

    @staticmethod
    def add_user(user_details):
        """
            adds a new user if user is not already present , if present updates user details
        :param user_details:
        :return:
        """
        chat_users_list = ChatUsers.query(ChatUsers.uid == user_details['uid']).fetch()

        if isinstance(chat_users_list, list) and (len(chat_users_list) > 0):
            chat_user_instance = chat_users_list[0]
            if not(chat_user_instance.chat_id.lower() == str(user_details['chat_id']).lower()):
                chat_user_instance = ChatUsers()
        else:
            chat_user_instance = ChatUsers()

        chat_user_instance.chat_id = str(user_details['chat_id']).lower()
        chat_user_instance.uid = user_details['uid']
        if user_details['gravatar']:
            chat_user_instance.gravatar = user_details['gravatar']
        if user_details['username']:
            chat_user_instance.username = user_details['username']

        chat_user_instance.online = True
        chat_user_instance.last_online = user_details['last_online']
        chat_user_instance.is_admin = user_details['is_admin']
        chat_user_instance.chat_revoked = user_details['chat_revoked']
        chat_user_instance.put()
        return chat_user_instance


class Attachments(Utilities):
    message_id = ndb.StringProperty()
    filename = ndb.StringProperty()
    url = ndb.StringProperty()


class ChatMessages(Utilities):
    
    message_id = ndb.StringProperty()
    chat_id = ndb.StringProperty()
    uid = ndb.StringProperty()
    message = ndb.TextProperty()
    timestamp = ndb.IntegerProperty(default=0) # in millisecond
    attachments = ndb.StringProperty()
    archived = ndb.BooleanProperty(default=False)

    def get_chat_message(self, chat_id):

        # ordering messages by the order in which they where sent
        # TODO- include all limits and constants on constants utility
        messages_list = ChatMessages.query(ChatMessages.chat_id == str(chat_id).lower()).order(ChatMessages.timestamp).fetch(limit=self._max_query_limit)

        payload = []

        for message in messages_list:
            attach = {'filename': '', 'url': '', 'message_id': ''}
            response = message.to_dict()
            if message.attachments == 'yes':
                attachments = Attachments.query(Attachments.message_id == message.message_id).fetch()
                if isinstance(attachments, list) and len(attachments) > 0:
                    attach['filename'] = attachments[0].filename
                    attach['url'] = attachments[0].url
                    attach['message_id'] = attachments[0].message_id
                    response['attachments'] = attach
                else:
                    response['attachments'] = attach
            else:
                response['attachments'] = attach

            if not message.archived:
                payload.append(response)

        return payload

    def add_message(self, message_detail, chat_id):

        try:
            logging.info('receving this message : {}'.format(message_detail))
            uid = str(message_detail['uid']).strip()

            if uid == '':
                return ""
            message_instance = ChatMessages()
            if message_detail['message_id'] == "":
                message_instance.message_id = self.create_id()
            else:
                message_instance.message_id = message_detail['message_id']

            message_instance.chat_id = str(message_detail['chat_id']).encode('utf-8').lower()
            message_instance.uid = uid
            message_instance.message = message_detail['message'].encode('utf-8')
            if message_detail['timestamp'] == 0:
                message_instance.timestamp = self.create_timestamp()
            else:
                message_instance.timestamp = message_detail['timestamp']

            attachments = message_detail['attachments']
            if (attachments['url'] != '') and (attachments['filename'] != ''):
                attachment_instance = Attachments()
                attachment_instance.url = attachments['url'].encode('utf-8')
                attachment_instance.filename = attachments['filename'].encode('utf-8')
                attachment_instance.message_id = message_instance.message_id
                attachment_instance.put()
                message_instance.attachments = 'yes'
            else:
                message_instance.attachments = 'no'

            message_instance.archived = False
            message_instance.put()
            
            return message_instance
        
        except Exception as error:
            logging.error('exception: thrown by add_message : {}'.format(error))
            return ""


class ChatRoom (Utilities):
    chat_id = ndb.StringProperty()
    created_by = ndb.StringProperty()
    name = ndb.StringProperty()
    description = ndb.StringProperty()

    @staticmethod
    def get_chat_room(uid, chat_id):

        chat_rooms = ChatRoom.query(ChatRoom.chat_id == str(chat_id).lower()).fetch()
        if len(chat_rooms) > 0:
            chat_room = chat_rooms[0]
        else:
            chat_room = ''

        return chat_room

    @staticmethod
    def add_chat_room(room_detail, uid):

        chat_room_query = ChatRoom.query(ChatRoom.chat_id == str(room_detail['chat_id']).lower())
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

    @staticmethod
    def fetch_chat_rooms():
        chat_room_query = ChatRoom.query()
        return chat_room_query.fetch()

    def delete_chat_room(self, uid, chat_id):
        pass

    def update_chat_room(self, room_detail, uid, chat_id):
        pass