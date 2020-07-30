#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
import webapp2
import jinja2
from google.appengine.ext import ndb
from google.appengine.api import users
import logging
import datetime
template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.getcwd()))
#import firebase_admin
#from firebase_admin import credentials
#cred = credentials.Certificate('templates/firebase/service_account.json')
#default_app = firebase_admin.initialize_app(cred)

#TODO- Create a main router for all the URLS
#TODO- The main routers should route only this Address /.* and will work as long as its the last router to execute and also help catch all other errors

class MainRouterHandler(webapp2.RequestHandler):

    def RouteSitemap(self):
        #TODO- Consider creating a dynamic sitemap by actually crawling my site and then outputting the sitemap here
        #TODO- i think i use to have a function to do this coupled with thoth
        template = template_env.get_template('templates/sitemap.xml')
        context = {}
        self.response.headers["Content-Type"] = 'text/xml'
        self.response.write(template.render(context))

    def RouteRobots(self):

        # create a robots.txt

        template = template_env.get_template('templates/robots.txt')
        context = {}
        self.response.headers["Content-Type"] = "text/plain"
        self.response.write(template.render(context))


    def RouteHome(self):
        template = template_env.get_template('templates/index.html')
        context = {}
        self.response.headers["Content-Type"] = "text/html"
        self.response.write(template.render(context))



    def RouteAdsText(self):
        template = template_env.get_template('templates/ads.txt')
        context = {}
        self.response.headers["Content-Type"] = "text/plain"
        self.response.write(template.render(context))

    def get(self):
        url_route = self.request.uri
        route = url_route.split("/")
        

        if 'sitemap.xml' in route:
            self.RouteSitemap()
        elif 'robots.txt' in route:
            self.RouteRobots()


        elif 'ads.txt'  in route:
            self.RouteAdsText()
        else:            
            self.RouteHome()

    def post(self):
        self.RouteHome()



app = webapp2.WSGIApplication([
    ('.*', MainRouterHandler)

], debug=True)
