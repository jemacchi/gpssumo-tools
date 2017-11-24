import urllib
import urllib2
import ast
import datetime

#url = 'http://www.gpssumo.com/ajax/ebus_dev/get_todos/faa8f91f9b9fbc077ac44ca18aaa7b97/0'
url = 'http://www.gpssumo.com/ajax/ebus_dev/get/faa8f91f9b9fbc077ac44ca18aaa7b97/0'
data = urllib.urlencode({'t' : '0','r' :'3_500'})
req = urllib2.Request(url, data)
req.add_header('Referer', 'http://www.gpssumo.com/')
req.add_header('Origin', 'http://www.gpssumo.com/')
req.add_header('X-Requested-With', 'XMLHttpRequest')
response = urllib2.urlopen(req)
strrsp = response.read()
print strrsp
