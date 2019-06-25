#
# route_planner.py
# Author: George Christian
#
# Assigns an order to jobs on the basis of their location and time since
# the job was filed.
#

import math
import u2py
from datetime import date

# Graph node
class MSTNode:
    def __init__(self):
        self.id = ""
        self.latitude = 0.0
        self.longitude = 0.0
        self.our_loc = "n"
        self.description = ""
        self.job = None

        # Graph structure
        self.key = 0.0
        self.parent = None
        self.deleted = False
        self.priority_counter = 1

    def calc_weight(self, node):
        val1 = (self.latitude - node.latitude) * (self.latitude - node.latitude)
        val2 = (self.longitude - node.longitude) * (self.longitude - node.longitude)
        return math.sqrt(val1 + val2)

class Job:
    def __init__(self):
        self.id = ""
        self.location = ""
        self.date_filed = 0
        self.start_date = 0
        self.priority = 0
        self.cont_from = ""
        self.description = ""

        self.node = None

# Find and store all our home locations
def get_our_locations(nodes, loc_file):
    cmd = u2py.Command('SELECT LOCATIONS WITH OUR_FACILITY="y"')
    cmd.run()
    id_list = u2py.List(0)
    num = 0
    next_id = str(id_list.next())
    while next_id != "":
        rec = loc_file.read(next_id)
        our_loc = MSTNode()
        our_loc.id = next_id
        our_loc.latitude = float(rec.extract(1))
        our_loc.longitude = float(rec.extract(2))
        our_loc.our_loc = str(rec.extract(4))
        our_loc.description = str(rec.extract(6))
        next_id = str(id_list.next())
        num += 1
        nodes.append(our_loc)
    id_list.clear()
    return num

# Plot a Minimum Spanning Tree (MST) with the provided nodes
def plot_mst(nodes, num_our_locs):
    # Initialise tree information
    for node in nodes:
        node.key = 1000000
        node.parent = None
        node.deleted = False
    for i in range(num_our_locs):
        nodes[i].key = 0

    done = False
    while not done:
        # Extract the node with the smallest key
        min_key = 1000000
        min_key_node = None
        for node in nodes:
            if node.key < min_key and node.deleted == False:
                min_key_node = node
                min_key = node.key
        min_key_node.deleted = True

        # Conduct a nearest neighbour search
        min_dist = 1000000
        cur_nearest = None
        for node in nodes:
            if node.deleted == False:
                dist = node.calc_weight(min_key_node)
                if dist < node.key:
                    node.key = dist
                    node.parent = min_key_node

        # Check if we are done
        done = True
        for node in nodes:
            if node.deleted == False:
                done = False

def calc_routes(nodes, jobs, jobs_file, num_our_locs):
    priority_counters = []
    # Initialise priority counters
    for i in range(num_our_locs):
        nodes[i].priority = 1

    done = False
    while not done:
        min_date = 1000000
        next_job = None

        # Get and format today's date
        today = date.today()
        today_str = "%i/%i/%i" % (today.day, today.month, today.year)
        today_int = int(u2py.DynArray(today_str).iconv("d4/"))
        for job in jobs:
            if job.start_date >= today_int and job.priority == 0:
                next_job = job
                min_date = 0
            if job.date_filed < min_date and job.priority == 0:
                next_job = job
                min_date = job.date_filed

        # Trace back through the MST to the nearest home location
        path = []
        next_node = next_job.node
        cont_from = ""
        path.append(next_node)
        our_loc = path[0].parent
        while next_node.parent.our_loc != "y":
            path.append(next_node.parent)
            # If we reach another route then store the branch point
            if next_node.parent.job.priority != 0 and cont_from == "":
                cont_from = str(next_node.parent.description)
            next_node = next_node.parent
            our_loc = next_node.parent
        if cont_from == "":
            cont_from = str(our_loc.description)

        # Write the updated records
        visit_order = 1
        for node in reversed(path):
            job = node.job
            if job.priority == 0:
                job.priority = our_loc.priority_counter

                # Write info
                rec = jobs_file.read(job.id)
                line_to = u2py.DynArray()
                line_to.insert(1,1,0,node.parent.latitude)
                line_to.insert(1,2,0,node.parent.longitude)
                rec.replace(4, job.priority)
                rec.replace(5, today_int)
                rec.replace(6, our_loc.id)
                rec.replace(7, visit_order)
                rec.replace(8, cont_from)
                rec.replace(10, line_to)
                jobs_file.write(job.id, rec)
                
                visit_order += 1
                cont_from = ""

        our_loc.priority_counter += 1
        
        # Check if we are done
        done = True
        for job in jobs:
            if job.priority == 0:
                done = False

# Graph information
nodes = []
jobs = []
num_our_locs = 0

print("Starting priority calculation program")

jobs_file = u2py.File("JOBS")
loc_file = u2py.File("LOCATIONS")

u2py.List(0).clear()
num_our_locs = get_our_locations(nodes, loc_file)

# Create a select list with all the active jobs
cmd = u2py.Command("SELECT JOBS")
cmd.run()
id_list = u2py.List(0)
next_id = str(id_list.next())
while next_id != "":
    # Read jobs
    rec = jobs_file.read(next_id)
    new_job = Job()
    new_job.id = str(next_id)
    new_job.location = str(rec.extract(1))
    new_job.date_filed = int(rec.extract(2))
    new_job.description = str(rec.extract(11))
    start_date = rec.extract(9)
    if str(start_date) != "":
        new_job.start_date = int(start_date)

    # Read associated locations
    rec = loc_file.read(new_job.location)
    new_node = MSTNode()
    new_node.id = str(new_job.location)
    new_node.latitude = float(rec.extract(1))
    new_node.longitude = float(rec.extract(2))
    new_node.our_loc = str(rec.extract(4))
    new_node.description = str(rec.extract(6))

    # Link them together
    new_job.node = new_node
    new_node.job = new_job
    
    nodes.append(new_node)
    jobs.append(new_job)
    next_id = str(id_list.next())
id_list.clear()

print("Plotting the minimum spanning tree for the job locations")
plot_mst(nodes, num_our_locs)
print("Calculating routes")
calc_routes(nodes, jobs, jobs_file, num_our_locs)
print("FINISHED")

jobs_file.close()
loc_file.close()
