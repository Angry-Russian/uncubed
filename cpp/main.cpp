// starting out with C++

#include <iostream>
#include <string>
#include <vector>

using namespace std;

struct Adapter{
	struct Face * target;
};

struct Face {
	string name;
	int color;
	Adapter refs[];
};


//    _____
//   /     \
//	◈---◈---◈
//	|\ / \ /|
//	| ◈---◈ |
//	\  \ /  /
//	 -- ◈ --

vector<Face> construct(int dimentions){
	for(int i = 0; i<dimentions-1){ // layers of the lattice
		for(int j = 0; j< dimentions; j++){ // faces per layer
			// connects to j and j+1 of previous layer, if any,  otherwise to next and previous faces
		}
		// connect last face in the loop to the first
	}
	return vector<Face>(n);
};

int main(){
	cout << "Starting cube structuring!\n";
	
	vector<Face> faces = construct(6);
	vector<Face>::iterator f = faces.begin();
	
	int index = 0;
	while(f<faces.end()){
		Face face = *f;
		
		face.name = "Face ";
		face.refs = vector<Adapter>(4);
		
		cout<<face.name << (++index) << '\n';
		f++;
	}
	return 0;
};