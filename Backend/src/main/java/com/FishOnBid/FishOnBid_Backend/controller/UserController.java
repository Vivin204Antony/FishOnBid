package com.FishOnBid.FishOnBid_Backend.controller;

import com.FishOnBid.FishOnBid_Backend.dto.UserDTO;
import com.FishOnBid.FishOnBid_Backend.entity.User;
import com.FishOnBid.FishOnBid_Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")  // ADD THIS LINE
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/test")
    public String testApi() {
        return "API is working fine!";
    }

    @PostMapping("/add")
    public User addUser(@RequestBody User user) {

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable long id) {
        return userRepository.findById(id).orElse(null);
    }

    @PutMapping("/update/{id}")
    public String updateUser(@PathVariable long id, @RequestBody UserDTO dto) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return "User not found!";

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());

        userRepository.save(user);
        return "User updated successfully!";
    }

    @DeleteMapping("/delete/{id}")
    public String deleteUser(@PathVariable long id) {
        userRepository.deleteById(id);
        return "User deleted successfully!";
    }
}