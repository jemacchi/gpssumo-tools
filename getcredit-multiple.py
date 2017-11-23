import threading, urllib2
import Queue
import datetime

now = datetime.datetime.now()
file = open('results/credit-'+str(now.date())+'.txt','w')

fromcard = 10000000
#tocard = 10250000
tocard = 10000050

urls_to_load = []

for x in range(fromcard, tocard):
    card = x
    url = 'http://www.gpssumo.com/movimientos/get_movimientos/'+str(card)+'/3'
    urls_to_load.append(url)

def read_url(url, queue):
    data = urllib2.urlopen(url).read()
    card = url[url.find('/get_movimientos/')+17:url.find('/3')]
    line = str(card)+','+data[data.find('saldo : ')+11:data.find(', saldo_viajes :')-1]+'\n'
    file.write(line)
    print('Fetched %s from %s' % (len(data), url))
    queue.put(line)

def fetch_parallel():
    result = Queue.Queue()
    threads = [threading.Thread(target=read_url, args = (url,result)) for url in urls_to_load]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return result

def fetch_sequencial():
    result = Queue.Queue()
    for url in urls_to_load:
        read_url(url,result)
    return result

r = fetch_sequencial()

file.close()