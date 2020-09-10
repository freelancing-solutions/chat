
import os, webapp2, jinja2,math
from google.appengine.ext import ndb
import logging, json, string, random, logging, datetime


from chat import ChatUsers, ChatRoom, ChatMessages



def archiveMessages():
    """
        # Archive Messages older than 72 hours
        # archived messages are not normally sent when messages are retrieved
    """

    messages_query = ChatMessages.query(ChatMessages.archived == False)
    messages_list = messages_query.fetch()

    for message in messages_list:
        # calculate the difference between the present time and timestamp of message in hours
        # if hours greater than 72 then archive message
        # if this prooves to be computationally heavy try using the clients processing power to process this
        pass

class TasksRouter(webapp2.RequestHandler):
    def get(self):
        url_route = self.request.uri
        url_routes = url_route.split("/")
        route = url_routes

        router = route[len(route)-1]
        logging.info(router)

        if 'archive-messages' in route:
            archiveMessages()



app = webapp2.WSGIApplication([
    ('/tasks/.*', TasksRouter)])
