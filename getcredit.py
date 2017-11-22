import urllib2
import datetime

card = 10026324
now = datetime.datetime.now()
response = urllib2.urlopen('http://www.gpssumo.com/movimientos/get_movimientos/'+str(card)+'/3')
rslt = response.read()

line = str(card)+','+rslt[rslt.find('saldo : ')+11:rslt.find(', saldo_viajes :')-1]
file = open('results/credit-'+str(now.date())+'.txt','w')
file.write(line)
file.close()