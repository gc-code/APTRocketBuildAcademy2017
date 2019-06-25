# Winning entry for the APT Rocket.Build Academy 2017

This is a route planning application for firms that complete many
geographically separated jobs in the course of their business.
An example would be a door and window servicing firm.

## About the competition

The competition challenged students from across the UK to build software
using Rocket's Multi-Value database, UniData. Students had 2 months in
which to learn the database then develop an application of their choice
that would impress the judges.

This repository contains the code from my entry that ended up winning the
competition.

More details can be found on the competition website here: http://www.aptrocketbuild.academy/

## Files

 * ```BP/``` Contains my first attempt at producing the route planner in Rocket's
 programming language 'UniBasic'
 * ```PP/``` Contains the final route planner, for which I switched to the UniData Python integration.
 It also contains code that communicates with the http://api.postcodes.io/ web service for converting a postcode
 into a latitude and longitude.
 * ```WEB/``` Contains the code for the web interface to my entry.
 * ```Documentation/``` Contains the documentation I included with my submission.

 ## Running

 The code cannot be executed in its current form due to its reliance on the UniData database. Access
 to the database and supporting tools is withdrawn at the end of the competition.
 