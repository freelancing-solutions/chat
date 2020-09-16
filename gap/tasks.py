
import os, webapp2, jinja2,math
from google.appengine.ext import ndb
import logging, json, string, random, logging, datetime


from chat import ChatUsers, ChatRoom, ChatMessages, Utilities


class TasksRouter(webapp2.RequestHandler, Utilities):

    def archive_messages(self):
        """
            # Archive Messages older than 72 hours
            # archived messages are not normally sent when messages are retrieved
        """    
        messages_list = ChatMessages.query(ChatMessages.archived == False).fetch(limit=self._max_query_limit)
        for message in messages_list:
            # calculate the difference between the present time and timestamp of message in hours
            # if hours greater than 72 then archive message
            # if this prooves to be computationally heavy try using the clients processing power to process this
            if message.timestamp < (Utilities.create_timestamp() - ( 60 * 60 * 24 * 3 * 1000)):
                message.archived = True
                message.put()

    def delete_messages(self):
        """
            delete archived messages older than 10 days
        """

        messages_list = ChatMessages.query(ChatMessages.archived == True).fetch(limit=self._max_query_limit)
        for message in messages_list:
            if message.timestamp < (Utilities.create_timestamp()) - (60 * 60 * 24 * 10 * 1000):
                message.key.delete()

    def get(self):
        url_route = self.request.uri
        url_routes = url_route.split("/")
        route = url_routes

        router = route[len(route)-1]
        logging.info(router)

        if 'archive-messages' in route:
            self.archive_messages()

        elif 'delete-messages' in route:
            self.delete_messages()

        else:
            pass


app = webapp2.WSGIApplication([
    ('/tasks/.*', TasksRouter)])
