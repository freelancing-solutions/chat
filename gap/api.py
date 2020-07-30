import os
import webapp2
import jinja2
from google.appengine.ext import ndb
from google.appengine.api import users
import logging,json

from chat import ChatRoom,ChatMessages,ChatUsers

class APIRouterHandler(webapp2.RequestHandler):
    
    def get(self):
        url_route = self.request.uri
        url_routes = url_route.split("/")
        route = url_routes
        
        status_int = 200

        if 'room' in route:

            chat_id = route[len(route) - 1]

            rooms_instance = ChatRoom()
            room = rooms_instance.getChatRoom(chat_id=chat_id)
            if room != '':
                response_data = room.to_dict()
            else:
                status_int = 401
                response_data = {'message': 'chat room not found'}

        elif 'rooms' in route:

            rooms_instance = ChatRoom()
            rooms = rooms_instance.fetchAllChatRooms()

            response_data = []
            for room in rooms:
                response_data.append(room.to_dict())


        elif 'user' in route:
            uid = route[len(route) - 1]
            users_instance = ChatUsers()
            response = users_instance.getUser(uid=uid)

            if response != '':
                response_data = response.to_dict()

        elif 'users' in route:
            chat_id = route[len(route) - 1]
            users_instance = ChatUsers()
            users = users_instance.getChatUsers(chat_id=chat_id)

            response_data = []

            for user in users:
                response_data.append(user.to_dict())

        elif 'messages' in route:
            chat_id = route[len(route) - 1]

            messages_instance = ChatMessages()
            messages = messages_instance.getChatMessages(chat_id=chat_id)

            response_data = []
            for message in messages:
                response_data.append(message.to_dict())

        else:
            status_int = 401
            response_data = {'message':'could not understand request'}




        self.response.headers['Content-Type'] = "application/json"
        self.response.status_int = status_int
        json_data = json.dumps(response_data)
        self.response.write(json_data)

    def post(self):
        url_route = self.request.uri
        url_routes = url_route.split("/")
        route = url_routes

        status_int = 200

        if 'room' in route:
            room_detail = json.loads(self.request.body)

            room_instance = ChatRoom()
            response = room_instance.addChatRoom(room_detail=room_detail)
            if response != '':
                response_data = response.to_dict()
            else:
                status_int = 401
                response_data = {'message':'chat room already present'}
        elif 'user' in route:
            user_details = json.loads(self.request.body)

            user_instance = ChatUsers()
            response = user_instance.addUser(user_details=user_details)
            if response != '':
                response_data = response.to_dict()
            else:
                pass

        elif 'message' in route:
            message_detail = json.loads(self.request.body)

            messages_instance = ChatMessages()
            response = messages_instance.addMessage(message_detail=message_detail)

            if response != '':
                response_data = response.to_dict()
            else:
                status_int = 401
                response_data = {'message':'error adding new chat message'}

        else:
            status_int = 401
            response_data = {'message': 'could not understand request'}

        self.response.headers['Content-Type'] = "application/json"
        self.response.status_int = status_int
        json_data = json.dumps(response_data)
        self.response.write(json_data)


app = webapp2.WSGIApplication([
    ('/api/.*', APIRouterHandler)


], debug=True)
