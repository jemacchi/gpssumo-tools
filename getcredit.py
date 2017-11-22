import urllib2
import datetime

now = datetime.datetime.now()
file = open('results/credit-'+str(now.date())+'.txt','w')

fromcard = 10000000
#tocard = 10250000
tocard = 10000010

for x in range(fromcard, tocard):
    card = x
    response = urllib2.urlopen('http://www.gpssumo.com/movimientos/get_movimientos/'+str(card)+'/3')
    rslt = response.read()
    line = str(card)+','+rslt[rslt.find('saldo : ')+11:rslt.find(', saldo_viajes :')-1]+'\n'
    file.write(line)
    print(x)

file.close()