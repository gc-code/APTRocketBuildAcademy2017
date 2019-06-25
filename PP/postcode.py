# Author: George Christian
#
# Converts a postcode into latitudes and longitudes.
#
import urllib.request
import json
import u2py

def postcode_to_latlong(postcode):
    coords = []
    postcode.replace(" ", "") # Remove all  whitespace
    # Retrieve the info from the api.postcodes.io free service
    resp = urllib.request.urlopen("http://api.postcodes.io/postcodes/%s" % (postcode))
    # Parse JSON
    decoded = resp.read().decode(resp.info().get_param('charset') or 'utf-8')
    postcode_data = json.loads(decoded)
    coords.append(postcode_data['result']['latitude'])
    coords.append(postcode_data['result']['longitude'])
    return coords

# Find the changed locations
loc_file = u2py.File("LOCATIONS")
u2py.List(0).clear()
cmd = u2py.Command("SELECT LOCATIONS")
cmd.run()
id_list = u2py.List(0)
next_id = str(id_list.next())
while next_id != "":
    rec = loc_file.read(next_id)
    if int(rec.extract(7)) == 1:
        # Write the postcode
        coords = postcode_to_latlong(str(rec.extract(5)))
        rec.replace(1, coords[0])
        rec.replace(2, coords[1])
        rec.replace(7, 0)
        loc_file.write(next_id, rec)
    next_id = str(id_list.next())

id_list.clear()
loc_file.close()
