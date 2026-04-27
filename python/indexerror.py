# Write a program to handle index error

try:
    list = [1, 2, 3]
    print(list[5])
except IndexError:
    print("Index out of range")

# Output:
# Index out of range
