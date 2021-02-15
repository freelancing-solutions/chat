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

            rooms_instance = ChatRoom()
            room = rooms_instance.get_chat_room(uid=route[len(route) - 1], chat_id=route[len(route) - 2])
            if room != '':
                response_data = room.to_dict()
            else:
                status_int = 401
                response_data = {'message': 'chat room not found'}

        elif 'rooms' in route:

            rooms_instance = ChatRoom()
            rooms = rooms_instance.fetch_chat_rooms()

            response_data = []
            for room in rooms:
                response_data.append(room.to_dict())

        elif 'user' in route:
            uid = route[len(route) - 1]
            users_instance = ChatUsers()
            response = users_instance.get_user(uid=uid)

            if response != '':
                response_data = response.to_dict()
            else: 
                status_int = 404
                response_data = {'message': 'user not found'}

        elif 'users' in route:
            users_instance = ChatUsers()
            response_data = users_instance.get_chat_users(chat_id=route[len(route) - 1])

        elif 'messages' in route:
            chat_id = route[len(route) - 1]

            messages_instance = ChatMessages()
            response_data = messages_instance.get_chat_message(chat_id=chat_id)

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
            response = room_instance.add_chat_room(room_detail=room_detail, uid=route[len(route) - 1])
            if response != '':
                response_data = response.to_dict()
            else:
                status_int = 401
                response_data = {'message':'chat room already present'}
                
        elif 'user' in route:
            user_details = json.loads(self.request.body)

            user_instance = ChatUsers()
            response = user_instance.add_user(user_details=user_details)
            response_data = response.to_dict()

        elif 'message' in route:
            message_detail = json.loads(self.request.body)
            logging.info('Message : {}'.format(message_detail))
            messages_instance = ChatMessages()
            response = messages_instance.add_message(message_detail=message_detail, chat_id=route[len(route) - 1])

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

    def put(self):
        url_route = self.request.uri
        url_routes = url_route.split("/")
        route = url_routes

        status_int = 200
        if 'room' in route:
            room_instance = ChatRoom()
            response = room_instance.update_chat_room(room_detail=json.loads(self.request.body), uid=route[len(route) - 1], chat_id=route[len(route) - 1])
            if response != '':
                response_data = response.to_dict()
            else:
                status_int = 401
                response_data = {'message': 'cannot update chat room'}
            
        else:
            status_int = 401
            response_data = {'message': 'could not understand request'}


        self.response.headers['Content-Type'] = "application/json"
        self.response.status_int = status_int
        json_data = json.dumps(response_data)
        self.response.write(json_data)

    def delete(self):
        url_route = self.request.uri
        url_routes = url_route.split("/")
        route = url_routes

        status_int = 200
        if 'room' in route:
            room_instance = ChatRoom()
            response = room_instance.delete_chat_room()
            if response != '':
                response_data = response.to_dict()
            else:
                status_int = 401
                response_data = {'message': 'cannot delete chat room'}
        else:
            status_int = 401
            response_data = {'message': 'could not understand request'}


        self.response.headers['Content-Type'] = "application/json"
        self.response.status_int = status_int
        json_data = json.dumps(response_data)
        self.response.write(json_data)

app = webapp2.WSGIApplication([
    ('/api/v1/.*', APIRouterHandler)

], debug=True)


